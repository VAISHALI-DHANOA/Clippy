import { useState, useRef, useCallback } from "react";
import { REACTIONS_TO_TEXT } from "../data/reactions.js";
import { EXPRESSIONS } from "../data/quotes.js";
import { getAIReaction } from "../services/aiService.js";
import { findMatchingReaction } from "../utils/textAnalysis.js";

export function useClippyReactions(showMessage, reactionMode = 'ai') {
  const [aiReacting, setAiReacting] = useState(false);
  const lastTextRef = useRef("");
  const reactionCooldowns = useRef({});
  const typingTimerRef = useRef(null);
  const lastAIReactionTime = useRef(0);

  const handleAIReaction = useCallback(async (userText) => {
    if (aiReacting) return;

    setAiReacting(true);
    try {
      const reply = await getAIReaction(userText);
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
      const significantChange = Math.abs(textLength - lastTextRef.current.length) > 30;

      // Check which mode the user selected
      if (reactionMode === 'ai' && textLength > 20 && !aiReacting) {
        // AI MODE: Use AI reactions
        const timeSinceLastAI = now - lastAIReactionTime.current;
        const aiCooldownPassed = timeSinceLastAI > 5000; // 5 seconds between AI reactions

        if (aiCooldownPassed) {
          // Always use AI when in AI mode
          lastAIReactionTime.current = now;
          handleAIReaction(newText);
          lastTextRef.current = newText;
          return; // Skip all local reactions in AI mode
        }
        // During cooldown, don't show any reactions
        lastTextRef.current = newText;
        return;
      }

      // REGEX MODE: Use pattern-based reactions
      if (reactionMode === 'regex') {
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
  }, [aiReacting, handleAIReaction, showMessage, reactionMode]);

  return { processTextChange };
}
