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

      // Check for local text reactions first with cooldown
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
      } else if (newText.length > 50 && !aiReacting) {
        // Trigger AI more frequently if API key is set
        const aiChance = apiKey ? 0.7 : 0;
        if (Math.random() < aiChance) {
          handleAIReaction(newText);
        }
      }

      lastTextRef.current = newText;
    }, 800); // Responsive delay
  }, [aiReacting, apiKey, handleAIReaction, showMessage]);

  return { processTextChange };
}
