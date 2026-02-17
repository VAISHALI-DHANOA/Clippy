import { useState, useRef, useCallback } from "react";
import { EXPRESSIONS } from "../data/quotes.js";
import { getSpreadsheetReaction } from "../services/aiService.js";
import { serializeSpreadsheetForAI } from "../components/SpreadsheetArea.jsx";

export function useSpreadsheetReactions(showMessage) {
  const [aiReacting, setAiReacting] = useState(false);
  const lastDataHashRef = useRef("");
  const lastReactionTime = useRef(0);
  const reactionTimerRef = useRef(null);

  const processDataChange = useCallback(
    (data, selectedCell) => {
      clearTimeout(reactionTimerRef.current);

      reactionTimerRef.current = setTimeout(async () => {
        const now = Date.now();
        if (now - lastReactionTime.current < 30000 || aiReacting) return;

        // Simple hash to detect actual data changes
        const dataHash = data.flat().map((c) => c.raw).join("|");
        if (dataHash === lastDataHashRef.current) return;
        if (dataHash.replace(/\|/g, "").trim().length < 3) return;

        lastDataHashRef.current = dataHash;
        lastReactionTime.current = now;
        setAiReacting(true);

        try {
          const tableText = serializeSpreadsheetForAI(data);
          const cellRef = selectedCell
            ? String.fromCharCode(65 + selectedCell.col) + (selectedCell.row + 1)
            : null;
          const reply = await getSpreadsheetReaction(tableText, cellRef);
          if (reply) {
            const expr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)];
            showMessage(reply, expr, "ai");
          }
        } catch (err) {
          console.error("Spreadsheet reaction failed:", err);
        } finally {
          setTimeout(() => setAiReacting(false), 1000);
        }
      }, 2000);
    },
    [aiReacting, showMessage]
  );

  return { processDataChange };
}
