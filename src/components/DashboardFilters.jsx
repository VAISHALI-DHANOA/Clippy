import { COLORS } from "./DataChart.jsx";

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  color: "#CE93D8",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 5,
  padding: "4px 8px",
  fontSize: 11,
  outline: "none",
  width: 56,
};

const btnStyle = {
  background: "rgba(156,39,176,0.2)",
  color: "#CE93D8",
  border: "1px solid rgba(156,39,176,0.3)",
  borderRadius: 5,
  padding: "4px 10px",
  fontSize: 11,
  cursor: "pointer",
  fontWeight: 600,
};

export default function DashboardFilters({ filters, numCols, onChange }) {
  const colNames = Array.from({ length: numCols }, (_, i) => String.fromCharCode(65 + i));

  const updateRowRange = (field, val) => {
    onChange({ ...filters, rowRange: { ...filters.rowRange, [field]: val } });
  };

  const addColumnFilter = () => {
    onChange({
      ...filters,
      columnFilters: [...filters.columnFilters, { col: 0, min: "", max: "" }],
    });
  };

  const updateColumnFilter = (idx, field, val) => {
    const updated = filters.columnFilters.map((f, i) =>
      i === idx ? { ...f, [field]: val } : f
    );
    onChange({ ...filters, columnFilters: updated });
  };

  const removeColumnFilter = (idx) => {
    onChange({ ...filters, columnFilters: filters.columnFilters.filter((_, i) => i !== idx) });
  };

  const clearAll = () => {
    onChange({ rowRange: { min: "", max: "" }, columnFilters: [] });
  };

  const hasAny = filters.rowRange.min !== "" || filters.rowRange.max !== "" || filters.columnFilters.length > 0;

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.15)",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.05)",
      fontSize: 11,
      color: "rgba(255,255,255,0.45)",
    }}>
      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Filters:</span>

      {/* Row range */}
      <span>Rows</span>
      <input
        type="number" placeholder="min" value={filters.rowRange.min}
        onChange={(e) => updateRowRange("min", e.target.value)}
        style={inputStyle}
      />
      <span>–</span>
      <input
        type="number" placeholder="max" value={filters.rowRange.max}
        onChange={(e) => updateRowRange("max", e.target.value)}
        style={inputStyle}
      />

      <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 2px" }}>|</span>

      {/* Column value filters */}
      {filters.columnFilters.map((cf, idx) => (
        <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <select
            value={cf.col}
            onChange={(e) => updateColumnFilter(idx, "col", parseInt(e.target.value))}
            style={{ ...inputStyle, width: 40 }}
          >
            {colNames.map((n, ci) => (
              <option key={ci} value={ci}>{n}</option>
            ))}
          </select>
          <input
            type="number" placeholder="min" value={cf.min}
            onChange={(e) => updateColumnFilter(idx, "min", e.target.value)}
            style={inputStyle}
          />
          <span>–</span>
          <input
            type="number" placeholder="max" value={cf.max}
            onChange={(e) => updateColumnFilter(idx, "max", e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={() => removeColumnFilter(idx)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, padding: 0 }}
          >✕</button>
        </span>
      ))}

      <button onClick={addColumnFilter} style={btnStyle}>+ Filter</button>

      {hasAny && (
        <button onClick={clearAll} style={{ ...btnStyle, background: "rgba(244,67,54,0.15)", color: "#ef9a9a", borderColor: "rgba(244,67,54,0.3)" }}>
          Clear all
        </button>
      )}
    </div>
  );
}
