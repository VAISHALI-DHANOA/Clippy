import { useState, useRef, useCallback } from "react";
import { REACTIONS_TO_TEXT } from "../data/reactions.js";
import { EXPRESSIONS } from "../data/quotes.js";
import { getAIReaction } from "../services/aiService.js";
import { findMatchingReaction } from "../utils/textAnalysis.js";

export function useClippyReactions(apiKey, showMessage) {
  const [aiReacting, setAiReacting] = useState(false);
  const lastTextRef = useRef("");
  const reactionCooldowns = useRef({});
  const typingTimerRef = useRef(null);
  const lastAIReactionTime = useRef(0);

  const handleAIReaction = useCallback(async (userText) => {
    if (aiReacting || !apiKey) return;

    setAiReacting(true);
    try {
      const reply = await getAIReaction(userText, apiKey);
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
  }, [aiReacting, apiKey, showMessage]);

  const processTextChange = useCallback((newText) => {
    clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const textLength = newText.length;
      const significantChange = Math.abs(textLength - lastTextRef.current.length) > 30;

      // PURE AI MODE: When API key exists, use ONLY AI reactions
      if (apiKey && textLength > 20 && !aiReacting) {
        const timeSinceLastAI = now - lastAIReactionTime.current;
        const aiCooldownPassed = timeSinceLastAI > 5000; // 5 seconds between AI reactions

        if (aiCooldownPassed) {
          // Always use AI when available (100% of the time)
          lastAIReactionTime.current = now;
          handleAIReaction(newText);
          lastTextRef.current = newText;
          return; // Skip all local reactions when API key is present
        }
        // During cooldown, don't show any reactions (prevents regex fallback)
        lastTextRef.current = newText;
        return;
      }

      // ONLY use regex patterns when NO API key is provided
      if (!apiKey) {
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
    }, 500); // Even more responsive
  }, [aiReacting, apiKey, handleAIReaction, showMessage]);

  return { processTextChange };
}
