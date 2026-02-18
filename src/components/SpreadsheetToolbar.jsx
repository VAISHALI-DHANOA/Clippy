import { useState, useEffect } from "react";

function toCellRef(row, col) {
  return String.fromCharCode(65 + col) + (row + 1);
}

export default function SpreadsheetToolbar({
  selectedCell,
  cellRaw,
  onFormulaSubmit,
  showChart,
  onToggleChart,
  chartType,
  onChartTypeChange,
}) {
  const [formulaValue, setFormulaValue] = useState("");

  useEffect(() => {
    setFormulaValue(cellRaw || "");
  }, [cellRaw, selectedCell]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onFormulaSubmit(formulaValue);
    }
  };

  const btnStyle = (active) => ({
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    border: active ? "1px solid #9C27B0" : "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(156,39,176,0.25)" : "rgba(255,255,255,0.04)",
    color: active ? "#CE93D8" : "rgba(255,255,255,0.5)",
    borderRadius: 5,
    cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      padding: "8px 10px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Cell reference badge */}
      <span style={{
        background: "rgba(156,39,176,0.15)",
        color: "#CE93D8",
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 14,
        fontFamily: "monospace",
        fontWeight: 600,
        minWidth: 36,
        textAlign: "center",
      }}>
        {selectedCell ? toCellRef(selectedCell.row, selectedCell.col) : "--"}
      </span>

      {/* Formula bar */}
      <input
        value={formulaValue}
        onChange={(e) => setFormulaValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter value or formula (e.g. =SUM(A1:A5))"
        style={{
          flex: 1,
          padding: "4px 10px",
          fontSize: 15,
          fontFamily: "monospace",
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          color: "#E0E0E0",
          outline: "none",
        }}
      />

      {/* Chart toggle */}
      <button onClick={onToggleChart} style={btnStyle(showChart)}>
        {showChart ? "Hide Chart" : "Show Chart"}
      </button>

      {/* Chart type (only when chart visible) */}
      {showChart && (
        <>
          <button onClick={() => onChartTypeChange("bar")} style={btnStyle(chartType === "bar")}>
            Bar
          </button>
          <button onClick={() => onChartTypeChange("line")} style={btnStyle(chartType === "line")}>
            Line
          </button>
        </>
      )}
    </div>
  );
}
