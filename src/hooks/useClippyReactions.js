import { useState, useRef, useCallback } from "react";
import { REACTIONS_TO_TEXT } from "../data/reactions.js";
import { EXPRESSIONS } from "../data/quotes.js";
import { getAIReaction } from "../services/aiService.js";
import { findMatchingReaction } from "../utils/textAnalysis.js";

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

function getMetrics(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const sentenceCount = (normalized.match(/[.!?](?=\s|$)/g) || []).length;
  const paragraphCount = String(text || "")
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;
  return {
    length: String(text || "").length,
    sentenceCount,
    paragraphCount,
  };
}

function pauseMsForText(text) {
  const raw = String(text || "");
  const trimmed = raw.trim();
  if (/\n\s*$/.test(raw)) return 500;
  if (/[.!?]["')\]]?\s*$/.test(trimmed)) return 700;
  return 1200;
}

export function useClippyReactions(showMessage, reactionMode = "ai", assistantConfig = {}) {
  const [aiReacting, setAiReacting] = useState(false);
  const lastTextRef = useRef("");
  const reactionCooldowns = useRef({});
  const typingTimerRef = useRef(null);
  const lastAIReactionTime = useRef(0);
  const lastAIMetricsRef = useRef({ length: 0, sentenceCount: 0, paragraphCount: 0 });
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

  const handleAIReaction = useCallback(async (userText) => {
    if (aiReacting) return;

    setAiReacting(true);
    try {
      const { mode, frequency, humorEnabled } = latestConfigRef.current;
      const reply = await getAIReaction(userText, { mode, frequency, humorEnabled });
      if (reply) {
        const randExpr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)];
        showMessage(reply, randExpr, "ai");
      }
    } catch (error) {
      console.error("AI reaction failed:", error);
      // Fallback to local reactions
      const reaction = REACTIONS_TO_TEXT.find((r) => r.trigger.test(userText));
      if (reaction) showMessage(reaction.response, "sassy");
    } finally {
      setTimeout(() => setAiReacting(false), 1000);
    }
  }, [aiReacting, showMessage]);

  const processTextChange = useCallback((newText) => {
    clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const textLength = newText.length;
      const mode = latestConfigRef.current.mode || "guided";
      const frequency = latestConfigRef.current.frequency || "balanced";
      const rule = MODE_RULES[mode] || MODE_RULES.guided;
      const frequencyFactor = FREQUENCY_FACTOR[frequency] || FREQUENCY_FACTOR.balanced;
      const cooldownMs = Math.round(rule.cooldownMs * frequencyFactor);
      const currentMetrics = getMetrics(newText);
      const previousMetrics = lastAIMetricsRef.current;
      const charsDelta = Math.abs(currentMetrics.length - previousMetrics.length);
      const sentenceAdvanced = currentMetrics.sentenceCount > previousMetrics.sentenceCount;
      const paragraphAdvanced = currentMetrics.paragraphCount > previousMetrics.paragraphCount;
      const longPause = now - lastAIReactionTime.current >= 15000;
      const meetsModeChangeRequirement = rule.requireParagraph
        ? paragraphAdvanced || charsDelta >= rule.minChars
        : paragraphAdvanced || sentenceAdvanced || charsDelta >= rule.minChars;
      const meaningfulChange = meetsModeChangeRequirement || (longPause && charsDelta >= Math.max(8, Math.floor(rule.minChars / 3)));

      // Check which mode the user selected
      if (reactionMode === "ai" && textLength > 20 && !aiReacting) {
        // AI MODE: Use AI reactions
        const timeSinceLastAI = now - lastAIReactionTime.current;
        const aiCooldownPassed = timeSinceLastAI > cooldownMs;

        if (aiCooldownPassed && meaningfulChange) {
          // Always use AI when in AI mode
          lastAIReactionTime.current = now;
          lastAIMetricsRef.current = currentMetrics;
          handleAIReaction(newText);
          lastTextRef.current = newText;
          return; // Skip all local reactions in AI mode
        }
        // During cooldown, don't show any reactions
        lastTextRef.current = newText;
        return;
      }

      // REGEX MODE: Use pattern-based reactions
      if (reactionMode === "regex") {
        const reaction = findMatchingReaction(
          REACTIONS_TO_TEXT,
          newText,
          lastTextRef.current,
          reactionCooldowns.current
        );

        if (reaction) {
          const idx = REACTIONS_TO_TEXT.indexOf(reaction);
          reactionCooldowns.current[idx] = now;
          showMessage(reaction.response, "sassy");
        }
      }

      lastTextRef.current = newText;
    }, pauseMsForText(newText));
  }, [aiReacting, handleAIReaction, showMessage, reactionMode]);

  return { processTextChange };
}
