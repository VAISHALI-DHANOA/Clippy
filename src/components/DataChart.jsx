const COLORS = ["#9C27B0", "#2196F3", "#4CAF50", "#FF9800", "#f44336"];

function extractChartData(data, labelCol, dataCols) {
  const numRows = data.length;
  const labels = [];
  const series = [];

  for (let r = 0; r < numRows; r++) {
    if (labelCol !== null && labelCol >= 0 && labelCol < data[0].length) {
      const v = data[r][labelCol].value;
      labels.push(v !== null ? String(v) : `Row ${r + 1}`);
    } else {
      labels.push(`${r + 1}`);
    }
  }

  for (const c of dataCols) {
    if (c < 0 || c >= data[0].length) continue;
    const colName = String.fromCharCode(65 + c);
    const values = data.map((row) => {
      const v = row[c].value;
      return typeof v === "number" ? v : 0;
    });
    series.push({ name: colName, values });
  }

  return { labels, series };
}

function BarChart({ labels, series, width, height }) {
  const pad = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const allValues = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allValues, 1);
  const barGroupW = chartW / labels.length;
  const barW = barGroupW / (series.length + 1);

  return (
    <svg width={width} height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pad.top + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y}
              stroke="rgba(255,255,255,0.06)" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.3)" fontSize={10}>
              {Math.round(maxVal * f)}
            </text>
          </g>
        );
      })}
      {series.map((s, si) =>
        s.values.map((val, vi) => {
          const x = pad.left + vi * barGroupW + si * barW + barW * 0.5;
          const barH = (val / maxVal) * chartH;
          const y = pad.top + chartH - barH;
          return (
            <rect key={`${si}-${vi}`} x={x} y={y} width={barW * 0.8}
              height={Math.max(barH, 0)} fill={COLORS[si % COLORS.length]}
              rx={2} opacity={0.85} />
          );
        })
      )}
      {labels.map((label, i) => (
        <text key={i}
          x={pad.left + i * barGroupW + barGroupW / 2}
          y={height - 6} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize={10}>
          {String(label).slice(0, 8)}
        </text>
      ))}
    </svg>
  );
}

function LineChart({ labels, series, width, height }) {
  const pad = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const allValues = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allValues, 1);
  const step = labels.length > 1 ? chartW / (labels.length - 1) : chartW;

  return (
    <svg width={width} height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pad.top + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y}
              stroke="rgba(255,255,255,0.06)" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.3)" fontSize={10}>
              {Math.round(maxVal * f)}
            </text>
          </g>
        );
      })}
      {series.map((s, si) => {
        const points = s.values.map((val, vi) => {
          const x = pad.left + vi * step;
          const y = pad.top + chartH - (val / maxVal) * chartH;
          return `${x},${y}`;
        }).join(" ");
        return (
          <g key={si}>
            <polyline points={points} fill="none"
              stroke={COLORS[si % COLORS.length]} strokeWidth={2} />
            {s.values.map((val, vi) => {
              const x = pad.left + vi * step;
              const y = pad.top + chartH - (val / maxVal) * chartH;
              return <circle key={vi} cx={x} cy={y} r={3} fill={COLORS[si % COLORS.length]} />;
            })}
          </g>
        );
      })}
      {labels.map((label, i) => (
        <text key={i}
          x={pad.left + i * step}
          y={height - 6} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize={10}>
          {String(label).slice(0, 8)}
        </text>
      ))}
    </svg>
  );
}

const colBtnStyle = (active, color) => ({
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: active ? 600 : 400,
  border: active ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.12)",
  background: active ? `${color}22` : "rgba(255,255,255,0.04)",
  color: active ? color : "rgba(255,255,255,0.4)",
  borderRadius: 5,
  cursor: "pointer",
  transition: "all 0.15s",
});

export default function DataChart({ data, chartType, labelCol, chartCols, onLabelColChange, onChartColsChange }) {
  const numCols = data[0].length;
  const allCols = Array.from({ length: numCols }, (_, i) => i);
  const colNames = allCols.map((i) => String.fromCharCode(65 + i));

  const toggleDataCol = (colIdx) => {
    if (chartCols.includes(colIdx)) {
      onChartColsChange(chartCols.filter((c) => c !== colIdx));
    } else {
      onChartColsChange([...chartCols, colIdx].sort());
    }
  };

  const setAsLabelCol = (colIdx) => {
    if (labelCol === colIdx) {
      onLabelColChange(null); // deselect
    } else {
      onLabelColChange(colIdx);
      // Remove from data cols if it was there
      onChartColsChange(chartCols.filter((c) => c !== colIdx));
    }
  };

  const { labels, series } = extractChartData(data, labelCol, chartCols);

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      background: "rgba(0,0,0,0.2)",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Column selector */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginRight: 4 }}>
          Labels:
        </span>
        {allCols.map((ci) => (
          <button
            key={`label-${ci}`}
            onClick={() => setAsLabelCol(ci)}
            style={colBtnStyle(labelCol === ci, "#FF9800")}
          >
            {colNames[ci]}
          </button>
        ))}
        <span style={{
          color: "rgba(255,255,255,0.15)",
          margin: "0 4px",
          fontSize: 14,
        }}>|</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginRight: 4 }}>
          Data:
        </span>
        {allCols.map((ci) => {
          const isLabel = labelCol === ci;
          const isData = chartCols.includes(ci);
          const colorIdx = isData ? chartCols.indexOf(ci) : 0;
          return (
            <button
              key={`data-${ci}`}
              onClick={() => !isLabel && toggleDataCol(ci)}
              disabled={isLabel}
              style={{
                ...colBtnStyle(isData, COLORS[colorIdx % COLORS.length]),
                ...(isLabel ? { opacity: 0.3, cursor: "not-allowed" } : {}),
              }}
            >
              {colNames[ci]}
            </button>
          );
        })}
      </div>

      {/* Chart or empty state */}
      {series.length === 0 ? (
        <div style={{
          padding: 20,
          textAlign: "center",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
          fontStyle: "italic",
        }}>
          Select data columns above to visualize.
        </div>
      ) : (
        <>
          {chartType === "line" ? (
            <LineChart labels={labels} series={series} width={560} height={220} />
          ) : (
            <BarChart labels={labels} series={series} width={560} height={220} />
          )}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {series.map((s, i) => (
              <span key={i} style={{ color: COLORS[i % COLORS.length], fontSize: 11 }}>
                {"■ "} Column {s.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
