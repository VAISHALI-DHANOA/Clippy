const COLORS = ["#9C27B0", "#2196F3", "#4CAF50", "#FF9800", "#f44336"];

function extractChartData(data) {
  const numRows = data.length;
  const numCols = data[0].length;
  const labels = [];
  const series = [];

  // Check if column A has text labels
  const colAIsLabels = data.some(
    (row) => row[0].value !== null && typeof row[0].value === "string" && row[0].value !== ""
  );

  const labelCol = colAIsLabels ? 0 : -1;
  const dataStartCol = colAIsLabels ? 1 : 0;

  for (let r = 0; r < numRows; r++) {
    if (labelCol >= 0) {
      labels.push(data[r][labelCol].value || `Row ${r + 1}`);
    } else {
      labels.push(`${r + 1}`);
    }
  }

  for (let c = dataStartCol; c < numCols; c++) {
    const colName = String.fromCharCode(65 + c);
    const values = data.map((row) => {
      const v = row[c].value;
      return typeof v === "number" ? v : 0;
    });
    if (values.some((v) => v !== 0)) {
      series.push({ name: colName, values });
    }
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

export default function DataChart({ data, chartType }) {
  const { labels, series } = extractChartData(data);

  if (series.length === 0) {
    return (
      <div style={{
        padding: 20,
        textAlign: "center",
        color: "rgba(255,255,255,0.3)",
        fontSize: 13,
        fontStyle: "italic",
      }}>
        Enter some numbers in the spreadsheet to see a chart.
      </div>
    );
  }

  const Chart = chartType === "line" ? LineChart : BarChart;

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      background: "rgba(0,0,0,0.2)",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <Chart labels={labels} series={series} width={560} height={220} />
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        {series.map((s, i) => (
          <span key={i} style={{ color: COLORS[i % COLORS.length], fontSize: 11 }}>
            {"■ "} Column {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
