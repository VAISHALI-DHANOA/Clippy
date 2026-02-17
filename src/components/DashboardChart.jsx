import { useState } from "react";
import { COLORS, extractChartData, BarChart, LineChart } from "./DataChart.jsx";
import ScatterChart from "./charts/ScatterChart.jsx";
import PieChart from "./charts/PieChart.jsx";
import HistogramChart from "./charts/HistogramChart.jsx";
import HeatmapChart from "./charts/HeatmapChart.jsx";

const CHART_TYPES = [
  { key: "bar", label: "Bar" },
  { key: "line", label: "Line" },
  { key: "scatter", label: "Scatter" },
  { key: "pie", label: "Pie" },
  { key: "histogram", label: "Histogram" },
  { key: "heatmap", label: "Heatmap" },
];

const selectStyle = {
  background: "rgba(255,255,255,0.06)",
  color: "#CE93D8",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 5,
  padding: "3px 6px",
  fontSize: 11,
  cursor: "pointer",
  outline: "none",
};

const colBtn = (active, color) => ({
  padding: "2px 7px",
  fontSize: 10,
  fontWeight: active ? 600 : 400,
  border: active ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
  background: active ? `${color}22` : "rgba(255,255,255,0.04)",
  color: active ? color : "rgba(255,255,255,0.35)",
  borderRadius: 4,
  cursor: "pointer",
  minWidth: 22,
  textAlign: "center",
});

function getColLetters(count) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

/* Read header names from the first row of data */
function getHeaderNames(data) {
  if (!data || data.length === 0) return [];
  return data[0].map((cell) => {
    const v = cell.value;
    return v !== null && v !== undefined ? String(v) : "";
  });
}

/* Extract data for each chart type from a cell grid (header row already stripped) */
function extractForChart(config, data) {
  if (!data || data.length === 0 || data[0].length === 0) return null;

  const numRows = data.length;
  const numCols = data[0].length;
  const getVal = (r, c) => {
    if (r >= numRows || c >= numCols) return null;
    return data[r][c].value;
  };
  const getNum = (r, c) => {
    const v = getVal(r, c);
    return typeof v === "number" ? v : 0;
  };
  const getLabel = (r, c) => {
    const v = getVal(r, c);
    return v !== null ? String(v) : "";
  };

  switch (config.chartType) {
    case "bar":
    case "line": {
      return extractChartData(data, config.labelCol, config.dataCols);
    }
    case "scatter": {
      if (config.xCol === null || config.yCol === null) return null;
      const x = [], y = [];
      for (let r = 0; r < numRows; r++) {
        x.push(getNum(r, config.xCol));
        y.push(getNum(r, config.yCol));
      }
      return { x, y };
    }
    case "pie": {
      const labels = [];
      const values = [];
      for (let r = 0; r < numRows; r++) {
        labels.push(config.labelCol !== null ? getLabel(r, config.labelCol) : `Row ${r + 1}`);
        values.push(config.dataCols.length > 0 ? getNum(r, config.dataCols[0]) : 0);
      }
      return { labels, values };
    }
    case "histogram": {
      if (config.dataCols.length === 0) return null;
      const values = [];
      for (let r = 0; r < numRows; r++) {
        values.push(getNum(r, config.dataCols[0]));
      }
      return { values };
    }
    case "heatmap": {
      if (config.heatRowCol === null || config.heatColCol === null || config.dataCols.length === 0) return null;
      const rowLabelsSet = [], colLabelsSet = [];
      const rowMap = {}, colMap = {};
      const rowOrigIndices = {};
      for (let r = 0; r < numRows; r++) {
        const rl = getLabel(r, config.heatRowCol);
        const cl = getLabel(r, config.heatColCol);
        if (!(rl in rowMap)) { rowMap[rl] = rowLabelsSet.length; rowLabelsSet.push(rl); }
        if (!(cl in colMap)) { colMap[cl] = colLabelsSet.length; colLabelsSet.push(cl); }
      }
      const matrix = Array.from({ length: rowLabelsSet.length }, () =>
        Array(colLabelsSet.length).fill(0)
      );
      const origIndices = {};
      for (let r = 0; r < numRows; r++) {
        const ri = rowMap[getLabel(r, config.heatRowCol)];
        const ci = colMap[getLabel(r, config.heatColCol)];
        matrix[ri][ci] += getNum(r, config.dataCols[0]);
        origIndices[ri] = r;
      }
      return { rowLabels: rowLabelsSet, colLabels: colLabelsSet, matrix, rowOrigIndices: origIndices };
    }
    default:
      return null;
  }
}

/* Parse pasted tab-separated text into a cell grid */
function parseCustomData(text) {
  if (!text.trim()) return null;
  const lines = text.trim().split("\n");
  return lines.map((line) =>
    line.split("\t").map((cell) => {
      const trimmed = cell.trim();
      const num = Number(trimmed);
      return { raw: trimmed, value: isNaN(num) || trimmed === "" ? (trimmed || null) : num, error: null };
    })
  );
}

export default function DashboardChart({ config, index, spreadsheetData, numCols, onUpdate, onRemove, highlightedRows, onHighlight, onClearHighlight }) {
  const [customText, setCustomText] = useState("");
  const ct = config.chartType;

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const base = { ...config, chartType: newType };
    // Reset type-specific fields
    if (newType === "scatter") {
      base.xCol = config.dataCols[0] ?? 0;
      base.yCol = config.dataCols[1] ?? 1;
    }
    if (newType === "heatmap") {
      base.heatRowCol = base.heatRowCol ?? 0;
      base.heatColCol = base.heatColCol ?? 1;
    }
    onUpdate(index, base);
  };

  const toggleDataCol = (c) => {
    const cols = config.dataCols.includes(c)
      ? config.dataCols.filter((x) => x !== c)
      : [...config.dataCols, c].sort();
    onUpdate(index, { ...config, dataCols: cols });
  };

  const fullData = config.source === "custom" ? parseCustomData(customText) : spreadsheetData;
  // First row is header labels; remaining rows are data
  const headerNames = fullData ? getHeaderNames(fullData) : [];
  const dataRows = fullData && fullData.length > 1 ? fullData.slice(1) : null;
  const chartData = extractForChart(config, dataRows);
  const srcCols = fullData && fullData[0] ? fullData[0].length : numCols;
  // Show header name if non-empty, otherwise fall back to column letter
  const colLetters = getColLetters(srcCols);
  const srcColNames = headerNames.map((h, i) => h || colLetters[i] || `${i}`);

  return (
    <div style={{
      background: "rgba(0,0,0,0.25)",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <select value={ct} onChange={handleTypeChange} style={selectStyle}>
          {CHART_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <select
          value={config.source}
          onChange={(e) => onUpdate(index, { ...config, source: e.target.value })}
          style={selectStyle}
        >
          <option value="spreadsheet">Spreadsheet</option>
          <option value="custom">Custom</option>
        </select>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onRemove(index)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
          }}
          title="Remove chart"
        >
          ✕
        </button>
      </div>

      {/* Column config */}
      <div style={{
        padding: "6px 12px",
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        fontSize: 10,
        color: "rgba(255,255,255,0.4)",
      }}>
        {(ct === "bar" || ct === "line" || ct === "pie") && (
          <>
            <span>Labels:</span>
            {srcColNames.map((n, ci) => (
              <button key={`l-${ci}`}
                onClick={() => onUpdate(index, { ...config, labelCol: config.labelCol === ci ? null : ci })}
                style={colBtn(config.labelCol === ci, "#FF9800")}>{n}</button>
            ))}
            <span style={{ margin: "0 3px", color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>Data:</span>
            {srcColNames.map((n, ci) => {
              const isLabel = config.labelCol === ci;
              const isData = config.dataCols.includes(ci);
              return (
                <button key={`d-${ci}`}
                  onClick={() => !isLabel && toggleDataCol(ci)}
                  disabled={isLabel}
                  style={{ ...colBtn(isData, COLORS[config.dataCols.indexOf(ci) % COLORS.length] || COLORS[0]), ...(isLabel ? { opacity: 0.3, cursor: "not-allowed" } : {}) }}
                >{n}</button>
              );
            })}
          </>
        )}
        {ct === "scatter" && (
          <>
            <span>X:</span>
            {srcColNames.map((n, ci) => (
              <button key={`x-${ci}`}
                onClick={() => onUpdate(index, { ...config, xCol: ci })}
                style={colBtn(config.xCol === ci, "#2196F3")}>{n}</button>
            ))}
            <span style={{ margin: "0 3px", color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>Y:</span>
            {srcColNames.map((n, ci) => (
              <button key={`y-${ci}`}
                onClick={() => onUpdate(index, { ...config, yCol: ci })}
                style={colBtn(config.yCol === ci, "#4CAF50")}>{n}</button>
            ))}
          </>
        )}
        {ct === "histogram" && (
          <>
            <span>Data:</span>
            {srcColNames.map((n, ci) => (
              <button key={`h-${ci}`}
                onClick={() => onUpdate(index, { ...config, dataCols: [ci] })}
                style={colBtn(config.dataCols[0] === ci, COLORS[1])}>{n}</button>
            ))}
            <span style={{ margin: "0 6px" }}>Bins:</span>
            <input
              type="number" min={2} max={50}
              value={config.bins || 10}
              onChange={(e) => onUpdate(index, { ...config, bins: parseInt(e.target.value) || 10 })}
              style={{ ...selectStyle, width: 40 }}
            />
          </>
        )}
        {ct === "heatmap" && (
          <>
            <span>Rows:</span>
            {srcColNames.map((n, ci) => (
              <button key={`hr-${ci}`}
                onClick={() => onUpdate(index, { ...config, heatRowCol: ci })}
                style={colBtn(config.heatRowCol === ci, "#FF9800")}>{n}</button>
            ))}
            <span style={{ margin: "0 3px", color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>Cols:</span>
            {srcColNames.map((n, ci) => (
              <button key={`hc-${ci}`}
                onClick={() => onUpdate(index, { ...config, heatColCol: ci })}
                style={colBtn(config.heatColCol === ci, "#2196F3")}>{n}</button>
            ))}
            <span style={{ margin: "0 3px", color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>Values:</span>
            {srcColNames.map((n, ci) => (
              <button key={`hv-${ci}`}
                onClick={() => onUpdate(index, { ...config, dataCols: [ci] })}
                style={colBtn(config.dataCols[0] === ci, "#4CAF50")}>{n}</button>
            ))}
          </>
        )}
      </div>

      {/* Custom data textarea */}
      {config.source === "custom" && (
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Paste tab-separated data here..."
          style={{
            background: "rgba(0,0,0,0.3)",
            color: "rgba(255,255,255,0.7)",
            border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            padding: "6px 12px",
            fontSize: 11,
            fontFamily: "monospace",
            resize: "vertical",
            height: 60,
            outline: "none",
          }}
        />
      )}

      {/* Chart render */}
      <div style={{ padding: 8, display: "flex", justifyContent: "center", minHeight: 180 }}>
        {!chartData ? (
          <div style={{ padding: 20, color: "rgba(255,255,255,0.25)", fontSize: 11, fontStyle: "italic", textAlign: "center", alignSelf: "center" }}>
            Configure columns above to visualize data.
          </div>
        ) : (
          <>
            {ct === "bar" && <BarChart labels={chartData.labels} series={chartData.series} width={320} height={200} highlightedRows={highlightedRows} onHighlight={onHighlight} onClearHighlight={onClearHighlight} />}
            {ct === "line" && <LineChart labels={chartData.labels} series={chartData.series} width={320} height={200} highlightedRows={highlightedRows} onHighlight={onHighlight} onClearHighlight={onClearHighlight} />}
            {ct === "scatter" && <ScatterChart data={chartData} width={320} height={200} highlightedRows={highlightedRows} onHighlight={onHighlight} onClearHighlight={onClearHighlight} />}
            {ct === "pie" && <PieChart data={chartData} width={320} height={200} highlightedRows={highlightedRows} onHighlight={onHighlight} onClearHighlight={onClearHighlight} />}
            {ct === "histogram" && <HistogramChart data={chartData} binCount={config.bins || 10} width={320} height={200} highlightedRows={highlightedRows} onHighlight={onHighlight} onClearHighlight={onClearHighlight} />}
            {ct === "heatmap" && <HeatmapChart data={chartData} width={320} height={200} highlightedRows={highlightedRows} onHighlight={onHighlight} onClearHighlight={onClearHighlight} />}
          </>
        )}
      </div>
    </div>
  );
}
