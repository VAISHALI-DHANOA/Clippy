import { COLORS } from "../DataChart.jsx";

export default function ScatterChart({ data, width = 280, height = 220, color, highlightedRows, onHighlight, onClearHighlight }) {
  const pad = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const c = color || COLORS[0];

  if (!data || data.x.length === 0) {
    return <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Select X and Y columns.</div>;
  }

  const minX = Math.min(...data.x);
  const maxX = Math.max(...data.x);
  const minY = Math.min(...data.y);
  const maxY = Math.max(...data.y);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const hasHl = highlightedRows && highlightedRows.size > 0;

  const mapX = (v) => pad.left + ((v - minX) / rangeX) * chartW;
  const mapY = (v) => pad.top + chartH - ((v - minY) / rangeY) * chartH;

  return (
    <svg width={width} height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pad.top + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={10}>
              {Math.round(minY + rangeY * f)}
            </text>
          </g>
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <text key={`x-${f}`} x={pad.left + chartW * f} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={10}>
          {Math.round(minX + rangeX * f)}
        </text>
      ))}
      {data.x.map((xVal, i) => {
        const isHl = hasHl && highlightedRows.has(i);
        return (
          <circle
            key={i}
            cx={mapX(xVal)}
            cy={mapY(data.y[i])}
            r={isHl ? 6 : 4}
            fill={c}
            opacity={hasHl ? (isHl ? 1 : 0.15) : 0.8}
            stroke={isHl ? "#fff" : "none"}
            strokeWidth={isHl ? 1.5 : 0}
            style={{ cursor: onHighlight ? "pointer" : "default" }}
            onMouseEnter={onHighlight ? () => onHighlight([i]) : undefined}
            onMouseLeave={onClearHighlight || undefined}
          >
            <title>{`(${xVal}, ${data.y[i]})`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
