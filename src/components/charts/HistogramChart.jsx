import { COLORS } from "../DataChart.jsx";

export default function HistogramChart({ data, binCount = 10, width = 280, height = 220, color, highlightedRows, onHighlight, onClearHighlight }) {
  const pad = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const c = color || COLORS[1];

  if (!data || data.values.length === 0) {
    return <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Select a data column.</div>;
  }

  const vals = data.values;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const binW = range / binCount;

  // Build bins with row indices
  const bins = Array.from({ length: binCount }, () => ({ count: 0, rows: [] }));
  vals.forEach((v, i) => {
    const idx = Math.min(Math.floor((v - min) / binW), binCount - 1);
    bins[idx].count++;
    bins[idx].rows.push(i);
  });

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const barW = chartW / binCount;
  const hasHl = highlightedRows && highlightedRows.size > 0;

  return (
    <svg width={width} height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pad.top + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={10}>
              {Math.round(maxCount * f)}
            </text>
          </g>
        );
      })}
      {bins.map((bin, i) => {
        const barH = (bin.count / maxCount) * chartH;
        const x = pad.left + i * barW;
        const y = pad.top + chartH - barH;
        const isHl = hasHl && bin.rows.some((r) => highlightedRows.has(r));
        return (
          <rect
            key={i}
            x={x + 1}
            y={y}
            width={Math.max(barW - 2, 1)}
            height={Math.max(barH, 0)}
            fill={c}
            rx={1}
            opacity={hasHl ? (isHl ? 1 : 0.2) : 0.8}
            stroke={isHl ? "#fff" : "none"}
            strokeWidth={isHl ? 1.5 : 0}
            style={{ cursor: onHighlight ? "pointer" : "default" }}
            onMouseEnter={onHighlight ? () => onHighlight(bin.rows) : undefined}
            onMouseLeave={onClearHighlight || undefined}
          >
            <title>{`${Math.round(min + i * binW)}-${Math.round(min + (i + 1) * binW)}: ${bin.count}`}</title>
          </rect>
        );
      })}
      {bins.map((_, i) => {
        if (i % Math.max(1, Math.floor(binCount / 5)) !== 0 && i !== binCount - 1) return null;
        return (
          <text key={`l-${i}`} x={pad.left + i * barW + barW / 2} y={height - 6}
            textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>
            {Math.round(min + i * binW)}
          </text>
        );
      })}
    </svg>
  );
}
