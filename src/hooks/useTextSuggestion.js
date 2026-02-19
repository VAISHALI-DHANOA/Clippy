import { useState, useRef, useCallback, useEffect } from "react";
import { getTextSuggestion } from "../services/aiService.js";

const MODE_RULES = {
  quiet: { minChars: 120, cooldownMs: 45000, requireParagraph: true },
  guided: { minChars: 40, cooldownMs: 20000, requireParagraph: false },
  brainstorm: { minChars: 20, cooldownMs: 12000, requireParagraph: false },
};

const FREQUENCY_FACTOR = {
  rare: 1.4,
  balanced: 1,
  frequent: 0.7,
};

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getTextMetrics(value) {
  const normalized = normalizeText(value);
  const sentences = normalized.match(/[.!?](?=\s|$)/g) || [];
  const paragraphs = value.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const tailWords = normalized.toLowerCase().split(" ").filter(Boolean).slice(-12).join(" ");
  return {
    length: value.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    tailWords,
  };
}

function pauseDelayForText(value) {
  const trimmed = value.trim();
  if (/\n\s*$/.test(value)) return 500;
  if (/[.!?]["')\]]?\s*$/.test(trimmed)) return 700;
  return 1200;
}

export function useTextSuggestion(text, assistantConfig = {}) {
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const suggestionTimerRef = useRef(null);
  const requestSeqRef = useRef(0);
  const lastRequestTimeRef = useRef(0);
  const forceRefreshOnceRef = useRef(false);
  const lastSuggestionRef = useRef("");
  const lastRequestMetricsRef = useRef({
    length: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    tailWords: "",
  });
  const latestConfigRef = useRef({
    mode: assistantConfig.mode || "guided",
    frequency: assistantConfig.frequency || "balanced",
    humorEnabled: assistantConfig.humorEnabled !== false,
  });

  latestConfigRef.current = {
    mode: assistantConfig.mode || "guided",
    frequency: assistantConfig.frequency || "balanced",
    humorEnabled: assistantConfig.humorEnabled !== false,
  };

  const fetchSuggestion = useCallback(async (currentText, options = {}) => {
    if (currentText.length < 10) return;

    const force = options.force === true;
    const now = Date.now();
    const metrics = getTextMetrics(currentText);
    const lastMetrics = lastRequestMetricsRef.current;
    const mode = latestConfigRef.current.mode || "guided";
    const frequency = latestConfigRef.current.frequency || "balanced";
    const modeRule = MODE_RULES[mode] || MODE_RULES.guided;
    const frequencyFactor = FREQUENCY_FACTOR[frequency] || FREQUENCY_FACTOR.balanced;
    const charsSinceLast = Math.abs(metrics.length - lastMetrics.length);
    const sentenceAdvanced = metrics.sentenceCount > lastMetrics.sentenceCount;
    const paragraphAdvanced = metrics.paragraphCount > lastMetrics.paragraphCount;
    const tailShifted = metrics.tailWords !== lastMetrics.tailWords;
    const longPause = now - lastRequestTimeRef.current >= 12000;
    const meetsModeRequirement = modeRule.requireParagraph
      ? paragraphAdvanced || charsSinceLast >= modeRule.minChars
      : paragraphAdvanced || sentenceAdvanced || charsSinceLast >= modeRule.minChars;
    const meaningfulChange = meetsModeRequirement || (longPause && charsSinceLast >= Math.max(8, Math.floor(modeRule.minChars / 3)));
    const minCooldown = Math.round(modeRule.cooldownMs * frequencyFactor);
    const cooldownPassed = now - lastRequestTimeRef.current >= minCooldown;

    if (!force && !meaningfulChange) return;
    if (!force && !cooldownPassed) return;

    const requestId = ++requestSeqRef.current;
    lastRequestTimeRef.current = now;
    lastRequestMetricsRef.current = metrics;
    setIsLoading(true);

    try {
      const requestOptions = {
        mode: latestConfigRef.current.mode,
        frequency: latestConfigRef.current.frequency,
        humorEnabled: latestConfigRef.current.humorEnabled,
      };
      let newSuggestion = await getTextSuggestion(currentText, lastSuggestionRef.current, requestOptions);
      if (requestId !== requestSeqRef.current) return;
      const cleaned = String(newSuggestion || "").trim();
      const prevCleaned = String(lastSuggestionRef.current || "").trim();
      if (cleaned && prevCleaned && cleaned.toLowerCase() === prevCleaned.toLowerCase()) {
        newSuggestion = await getTextSuggestion(currentText, cleaned, requestOptions);
      }
      if (newSuggestion) {
        setSuggestion(newSuggestion);
        lastSuggestionRef.current = newSuggestion;
      }
    } catch (error) {
      console.error("Failed to fetch suggestion:", error);
      if (requestId === requestSeqRef.current) {
        setSuggestion("");
      }
    } finally {
      if (requestId === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    clearTimeout(suggestionTimerRef.current);

    // Clear suggestion if text is too short
    if (text.length < 10) {
      setSuggestion("");
      return;
    }

    // Debounce: wait for user to pause before evaluating context-aware refresh rules
    suggestionTimerRef.current = setTimeout(() => {
      const shouldForce = forceRefreshOnceRef.current;
      forceRefreshOnceRef.current = false;
      fetchSuggestion(text, { force: shouldForce });
    }, forceRefreshOnceRef.current ? 600 : pauseDelayForText(text));

    return () => clearTimeout(suggestionTimerRef.current);
  }, [text, fetchSuggestion]);

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
  }, []);

  const acceptSuggestion = useCallback(() => {
    const accepted = suggestion;
    if (accepted) {
      lastSuggestionRef.current = accepted;
      forceRefreshOnceRef.current = true;
    }
    clearSuggestion();
    return accepted;
  }, [suggestion, clearSuggestion]);

  return {
    suggestion,
    isLoading,
    clearSuggestion,
    acceptSuggestion,
  };
}
