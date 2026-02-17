import { useState, useRef, useCallback } from "react";
import { EXPRESSIONS } from "../data/quotes.js";
import { getDashboardReaction } from "../services/aiService.js";
import { serializeSpreadsheetForAI } from "../components/SpreadsheetArea.jsx";

export function useDashboardReactions(showMessage) {
  const [aiReacting, setAiReacting] = useState(false);
  const lastHashRef = useRef("");
  const lastReactionTime = useRef(0);
  const reactionTimerRef = useRef(null);

  const processDashboardChange = useCallback(
    (spreadsheetData, panels) => {
      clearTimeout(reactionTimerRef.current);

      reactionTimerRef.current = setTimeout(async () => {
        const now = Date.now();
        if (now - lastReactionTime.current < 30000 || aiReacting) return;

        // Build a hash from panel configs to detect changes
        const configStr = JSON.stringify(panels.map((p) => ({
          type: p.chartType,
          source: p.source,
          labelCol: p.labelCol,
          dataCols: p.dataCols,
          xCol: p.xCol,
          yCol: p.yCol,
        })));
        const dataHash = spreadsheetData.flat().map((c) => c.raw).join("|");
        const combined = configStr + "||" + dataHash;
        if (combined === lastHashRef.current) return;
        if (panels.length === 0) return;

        lastHashRef.current = combined;
        lastReactionTime.current = now;
        setAiReacting(true);

        try {
          const tableText = serializeSpreadsheetForAI(spreadsheetData);
          const dashConfig = panels
            .map((p, i) => `Chart ${i + 1}: ${p.chartType} (source: ${p.source}, cols: ${JSON.stringify(p.dataCols)})`)
            .join("\n");
          const reply = await getDashboardReaction(tableText, dashConfig);
          if (reply) {
            const expr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)];
            showMessage(reply, expr, "ai");
          }
        } catch (err) {
          console.error("Dashboard reaction failed:", err);
        } finally {
          setTimeout(() => setAiReacting(false), 1000);
        }
      }, 3000);
    },
    [aiReacting, showMessage]
  );

  return { processDashboardChange };
}
