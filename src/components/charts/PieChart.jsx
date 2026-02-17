import { COLORS } from "../DataChart.jsx";

export default function PieChart({ data, width = 280, height = 220, highlightedRows, onHighlight, onClearHighlight }) {
  if (!data || data.values.length === 0) {
    return <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Select a data column.</div>;
  }

  const total = data.values.reduce((a, b) => a + Math.abs(b), 0);
  if (total === 0) {
    return <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>All values are zero.</div>;
  }

  const cx = width / 2;
  const cy = height / 2 - 10;
  const r = Math.min(width, height) / 2 - 36;
  const hasHl = highlightedRows && highlightedRows.size > 0;

  let startAngle = -Math.PI / 2;
  const slices = data.values.map((val, i) => {
    const sliceAngle = (Math.abs(val) / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const isHl = hasHl && highlightedRows.has(i);
    // Explode highlighted slice outward
    const tx = isHl ? Math.cos(midAngle) * 6 : 0;
    const ty = isHl ? Math.sin(midAngle) * 6 : 0;

    const slice = { d, color: COLORS[i % COLORS.length], label: data.labels[i] || `${i + 1}`, isHl, tx, ty, index: i };
    startAngle = endAngle;
    return slice;
  });

  return (
    <div>
      <svg width={width} height={height}>
        {slices.map((s) => (
          <path
            key={s.index}
            d={s.d}
            fill={s.color}
            opacity={hasHl ? (s.isHl ? 1 : 0.25) : 0.85}
            transform={`translate(${s.tx}, ${s.ty})`}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={1}
            style={{ cursor: onHighlight ? "pointer" : "default", transition: "transform 0.15s, opacity 0.15s" }}
            onMouseEnter={onHighlight ? () => onHighlight([s.index]) : undefined}
            onMouseLeave={onClearHighlight || undefined}
          >
            <title>{`${s.label}: ${data.values[s.index]}`}</title>
          </path>
        ))}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {slices.map((s) => (
          <span key={s.index} style={{ color: s.color, fontSize: 10 }}>
            {"■ "}{String(s.label).slice(0, 10)}
          </span>
        ))}
      </div>
    </div>
  );
}
