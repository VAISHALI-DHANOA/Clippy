import { useState, useEffect, useMemo, useCallback } from "react";
import DashboardChart from "./DashboardChart.jsx";
import DashboardFilters from "./DashboardFilters.jsx";

function defaultPanel() {
  return {
    id: Date.now() + Math.random(),
    chartType: "bar",
    source: "spreadsheet",
    labelCol: 0,
    dataCols: [1],
    xCol: 0,
    yCol: 1,
    heatRowCol: 0,
    heatColCol: 1,
    bins: 10,
  };
}

const emptyFilters = { rowRange: { min: "", max: "" }, columnFilters: [] };

export default function DashboardArea({ spreadsheetData, onHighlightChange, onPanelsChange, compact = false }) {
  const [panels, setPanels] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [highlightedRows, setHighlightedRows] = useState(new Set());

  const numCols = spreadsheetData && spreadsheetData[0] ? spreadsheetData[0].length : 8;

  // Notify parent when panels change (for AI reactions)
  useEffect(() => {
    if (onPanelsChange) onPanelsChange(panels);
  }, [panels, onPanelsChange]);

  // Apply filters to spreadsheet data
  const filteredData = useMemo(() => {
    if (!spreadsheetData) return spreadsheetData;
    let rows = spreadsheetData;

    // Row range filter
    const minR = filters.rowRange.min !== "" ? parseInt(filters.rowRange.min) - 1 : 0;
    const maxR = filters.rowRange.max !== "" ? parseInt(filters.rowRange.max) - 1 : rows.length - 1;
    if (minR > 0 || maxR < rows.length - 1) {
      rows = rows.filter((_, i) => i >= minR && i <= maxR);
    }

    // Column value filters
    for (const cf of filters.columnFilters) {
      const col = cf.col;
      const hasMin = cf.min !== "";
      const hasMax = cf.max !== "";
      if (!hasMin && !hasMax) continue;
      const minVal = hasMin ? Number(cf.min) : -Infinity;
      const maxVal = hasMax ? Number(cf.max) : Infinity;
      rows = rows.filter((row) => {
        if (col >= row.length) return true;
        const v = row[col].value;
        if (typeof v !== "number") return true;
        return v >= minVal && v <= maxVal;
      });
    }

    return rows;
  }, [spreadsheetData, filters]);

  const handleHighlight = useCallback((rowIndices) => {
    const newSet = new Set(rowIndices);
    setHighlightedRows(newSet);
    if (onHighlightChange) onHighlightChange(newSet);
  }, [onHighlightChange]);

  const handleClearHighlight = useCallback(() => {
    setHighlightedRows(new Set());
    if (onHighlightChange) onHighlightChange(new Set());
  }, [onHighlightChange]);

  const addPanel = () => setPanels((prev) => [...prev, defaultPanel()]);

  const updatePanel = (index, newConfig) => {
    setPanels((prev) => prev.map((p, i) => (i === index ? { ...p, ...newConfig } : p)));
  };

  const removePanel = (index) => {
    setPanels((prev) => prev.filter((_, i) => i !== index));
  };

  const chartSize = compact ? "compact" : panels.length === 1 ? "wide" : "standard";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: "100%" }}>
      {/* Toolbar row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={addPanel} style={{
          background: "linear-gradient(135deg, rgba(156,39,176,0.3), rgba(123,31,162,0.3))",
          color: "#CE93D8",
          border: "1px solid rgba(156,39,176,0.3)",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
        }}>
          + Add Chart
        </button>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          {panels.length === 0 ? "Add a chart to start exploring your data." : `${panels.length} chart${panels.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Filters */}
      {panels.length > 0 && (
        <DashboardFilters filters={filters} numCols={numCols} onChange={setFilters} />
      )}

      {/* Chart grid */}
      {panels.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: compact
            ? "1fr"
            : panels.length === 1
            ? "1fr"
            : "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 14,
          alignItems: "stretch",
        }}>
          {panels.map((panel, i) => (
            <DashboardChart
              key={panel.id}
              config={panel}
              index={i}
              spreadsheetData={filteredData}
              numCols={numCols}
              onUpdate={updatePanel}
              onRemove={removePanel}
              highlightedRows={highlightedRows}
              onHighlight={handleHighlight}
              onClearHighlight={handleClearHighlight}
              chartSize={chartSize}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {panels.length === 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          color: "rgba(255,255,255,0.25)",
          fontSize: 16,
          gap: 14,
        }}>
          <span style={{ fontSize: 42 }}>📊</span>
          <span>Create interlinked charts to explore your spreadsheet data.</span>
          <span style={{ fontSize: 13, fontStyle: "italic" }}>Hover on any chart element to highlight matching data across all charts.</span>
        </div>
      )}
    </div>
  );
}
