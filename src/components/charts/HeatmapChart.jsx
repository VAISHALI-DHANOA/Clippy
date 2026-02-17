export default function HeatmapChart({ data, width = 280, height = 220, highlightedRows, onHighlight, onClearHighlight }) {
  const pad = { top: 10, right: 10, bottom: 30, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  if (!data || data.matrix.length === 0 || data.matrix[0].length === 0) {
    return <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Select row labels, column labels, and values.</div>;
  }

  const { rowLabels, colLabels, matrix, rowOrigIndices } = data;
  const cellW = chartW / colLabels.length;
  const cellH = chartH / rowLabels.length;

  const allVals = matrix.flat();
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const hasHl = highlightedRows && highlightedRows.size > 0;

  return (
    <svg width={width} height={height}>
      {matrix.map((row, ri) =>
        row.map((val, ci) => {
          const intensity = (val - minVal) / range;
          const origRow = rowOrigIndices ? rowOrigIndices[ri] : ri;
          const isHl = hasHl && highlightedRows.has(origRow);
          return (
            <rect
              key={`${ri}-${ci}`}
              x={pad.left + ci * cellW}
              y={pad.top + ri * cellH}
              width={cellW - 1}
              height={cellH - 1}
              fill={`rgba(156, 39, 176, ${0.1 + intensity * 0.85})`}
              stroke={isHl ? "#fff" : "rgba(255,255,255,0.05)"}
              strokeWidth={isHl ? 2 : 0.5}
              opacity={hasHl ? (isHl ? 1 : 0.3) : 1}
              style={{ cursor: onHighlight ? "pointer" : "default" }}
              onMouseEnter={onHighlight ? () => onHighlight([origRow]) : undefined}
              onMouseLeave={onClearHighlight || undefined}
            >
              <title>{`${rowLabels[ri]} / ${colLabels[ci]}: ${val}`}</title>
            </rect>
          );
        })
      )}
      {/* Column labels */}
      {colLabels.map((label, ci) => (
        <text key={`col-${ci}`} x={pad.left + ci * cellW + cellW / 2} y={height - 6}
          textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>
          {String(label).slice(0, 6)}
        </text>
      ))}
      {/* Row labels */}
      {rowLabels.map((label, ri) => (
        <text key={`row-${ri}`} x={pad.left - 4} y={pad.top + ri * cellH + cellH / 2 + 3}
          textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={9}>
          {String(label).slice(0, 6)}
        </text>
      ))}
    </svg>
  );
}
