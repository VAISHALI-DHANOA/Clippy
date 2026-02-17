import { useState, useCallback, useEffect, useRef } from "react";
import SpreadsheetToolbar from "./SpreadsheetToolbar.jsx";
import DataChart from "./DataChart.jsx";

// --- Cell addressing helpers ---

function parseCellRef(ref) {
  const col = ref.charCodeAt(0) - 65;
  const row = parseInt(ref.slice(1), 10) - 1;
  return { row, col };
}

function toCellRef(row, col) {
  return String.fromCharCode(65 + col) + (row + 1);
}

// --- Formula engine ---

function getRangeValues(data, start, end) {
  const values = [];
  const minR = Math.min(start.row, end.row);
  const maxR = Math.max(start.row, end.row);
  const minC = Math.min(start.col, end.col);
  const maxC = Math.max(start.col, end.col);
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (r >= data.length || c >= data[0].length) continue;
      const v = data[r][c].value;
      if (typeof v === "number") values.push(v);
    }
  }
  return values;
}

function evaluateFormula(expr, data) {
  // Function calls: SUM, AVG, AVERAGE, MIN, MAX, COUNT
  const funcMatch = expr.match(
    /^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]\d+):([A-Z]\d+)\)$/i
  );
  if (funcMatch) {
    const func = funcMatch[1].toUpperCase();
    const start = parseCellRef(funcMatch[2].toUpperCase());
    const end = parseCellRef(funcMatch[3].toUpperCase());
    const values = getRangeValues(data, start, end);
    switch (func) {
      case "SUM":
        return values.reduce((a, b) => a + b, 0);
      case "AVG":
      case "AVERAGE":
        if (values.length === 0) throw new Error("#DIV/0!");
        return values.reduce((a, b) => a + b, 0) / values.length;
      case "MIN":
        if (values.length === 0) throw new Error("#VALUE!");
        return Math.min(...values);
      case "MAX":
        if (values.length === 0) throw new Error("#VALUE!");
        return Math.max(...values);
      case "COUNT":
        return values.length;
      default:
        throw new Error("#NAME?");
    }
  }

  // Simple arithmetic: replace cell refs with values
  const arithmeticExpr = expr.replace(/[A-Z]\d+/gi, (ref) => {
    const { row, col } = parseCellRef(ref.toUpperCase());
    if (row < 0 || row >= data.length || col < 0 || col >= data[0].length) {
      throw new Error("#REF!");
    }
    const v = data[row][col].value;
    if (v === null || typeof v === "string") throw new Error("#VALUE!");
    return v;
  });

  if (!/^[\d+\-*/().  ]+$/.test(arithmeticExpr)) {
    throw new Error("#NAME?");
  }

  const result = Function('"use strict"; return (' + arithmeticExpr + ")")();
  if (!isFinite(result)) throw new Error("#DIV/0!");
  return Math.round(result * 10000) / 10000;
}

function recalculate(data) {
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const cell = data[r][c];
      const raw = cell.raw.trim();
      if (raw === "") {
        cell.value = null;
        cell.error = null;
      } else if (raw.startsWith("=")) {
        try {
          cell.value = evaluateFormula(raw.slice(1), data);
          cell.error = null;
        } catch (err) {
          cell.value = null;
          cell.error = err.message;
        }
      } else {
        const num = parseFloat(raw);
        cell.value = isNaN(num) ? raw : num;
        cell.error = null;
      }
    }
  }
}

function createEmptyGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ raw: "", value: null, error: null }))
  );
}

// --- Serialize for AI context ---

export function serializeSpreadsheetForAI(data) {
  const cols = data[0].length;
  const header =
    "   | " +
    Array.from({ length: cols }, (_, i) =>
      String.fromCharCode(65 + i).padStart(10)
    ).join(" | ");
  const divider = "-".repeat(header.length);
  const rows = data.map((row, ri) => {
    const cells = row
      .map((cell) => {
        const display =
          cell.error || (cell.value !== null ? String(cell.value) : "");
        return display.padStart(10);
      })
      .join(" | ");
    return `${String(ri + 1).padStart(3)}| ${cells}`;
  });
  return [header, divider, ...rows].join("\n");
}

// --- Styles ---

const baseCellStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "4px 8px",
  minWidth: 80,
  height: 28,
  color: "#E0E0E0",
  background: "rgba(0,0,0,0.2)",
  cursor: "cell",
  textAlign: "right",
  fontSize: 13,
  fontFamily: "monospace",
  position: "relative",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

const selectedCellStyle = {
  border: "2px solid #9C27B0",
  background: "rgba(156,39,176,0.1)",
};

const headerCellStyle = {
  background: "rgba(156,39,176,0.1)",
  color: "rgba(255,255,255,0.5)",
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center",
  userSelect: "none",
};

const rowHeaderStyle = {
  ...headerCellStyle,
  minWidth: 36,
  textAlign: "center",
};

const cellInputStyle = {
  width: "100%",
  height: "100%",
  padding: 0,
  margin: 0,
  border: "none",
  background: "transparent",
  color: "#E0E0E0",
  fontSize: 13,
  fontFamily: "monospace",
  textAlign: "right",
  outline: "none",
};

// --- Component ---

export default function SpreadsheetArea({
  data,
  onDataChange,
  selectedCell,
  onCellSelect,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const tableRef = useRef(null);

  const columns = Array.from({ length: data[0].length }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const commitEdit = useCallback(
    (row, col) => {
      setEditingCell(null);
      const newData = data.map((r) => r.map((c) => ({ ...c })));
      newData[row][col].raw = editValue;
      recalculate(newData);
      onDataChange(newData);
    },
    [data, editValue, onDataChange]
  );

  const handleCellClick = (row, col) => {
    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
      commitEdit(editingCell.row, editingCell.col);
    }
    onCellSelect({ row, col });
  };

  const handleCellDoubleClick = (row, col) => {
    setEditingCell({ row, col });
    setEditValue(data[row][col].raw);
  };

  const handleEditKeyDown = (e, row, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit(row, col);
      const nextRow = Math.min(row + 1, data.length - 1);
      onCellSelect({ row: nextRow, col });
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit(row, col);
      const nextCol = col + 1 < data[0].length ? col + 1 : 0;
      const nextRow =
        col + 1 < data[0].length ? row : Math.min(row + 1, data.length - 1);
      onCellSelect({ row: nextRow, col: nextCol });
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  // Keyboard nav when not editing
  const handleTableKeyDown = useCallback(
    (e) => {
      if (editingCell) return;
      if (!selectedCell) return;

      const { row, col } = selectedCell;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        onCellSelect({ row: Math.max(row - 1, 0), col });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onCellSelect({ row: Math.min(row + 1, data.length - 1), col });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onCellSelect({ row, col: Math.max(col - 1, 0) });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onCellSelect({ row, col: Math.min(col + 1, data[0].length - 1) });
      } else if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault();
        setEditingCell({ row, col });
        setEditValue(data[row][col].raw);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const newData = data.map((r) => r.map((c) => ({ ...c })));
        newData[row][col].raw = "";
        recalculate(newData);
        onDataChange(newData);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Start typing: replace cell content
        setEditingCell({ row, col });
        setEditValue(e.key);
      }
    },
    [editingCell, selectedCell, data, onCellSelect, onDataChange]
  );

  const addRow = () => {
    const newRow = Array.from({ length: data[0].length }, () => ({
      raw: "",
      value: null,
      error: null,
    }));
    onDataChange([...data, newRow]);
  };

  const addColumn = () => {
    const newData = data.map((row) => [
      ...row,
      { raw: "", value: null, error: null },
    ]);
    onDataChange(newData);
  };

  const handleFormulaSubmit = (value) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const newData = data.map((r) => r.map((c) => ({ ...c })));
    newData[row][col].raw = value;
    recalculate(newData);
    onDataChange(newData);
  };

  const selectedCellRaw = selectedCell
    ? data[selectedCell.row][selectedCell.col].raw
    : "";

  return (
    <div>
      <SpreadsheetToolbar
        selectedCell={selectedCell}
        cellRaw={selectedCellRaw}
        onFormulaSubmit={handleFormulaSubmit}
        showChart={showChart}
        onToggleChart={() => setShowChart((v) => !v)}
        chartType={chartType}
        onChartTypeChange={setChartType}
      />

      {/* Scrollable grid */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <table
          ref={tableRef}
          tabIndex={0}
          onKeyDown={handleTableKeyDown}
          style={{
            borderCollapse: "collapse",
            width: "100%",
            outline: "none",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, minWidth: 36 }}></th>
              {columns.map((col, ci) => (
                <th key={ci} style={headerCellStyle}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri}>
                <td style={rowHeaderStyle}>{ri + 1}</td>
                {row.map((cell, ci) => {
                  const isSelected =
                    selectedCell?.row === ri && selectedCell?.col === ci;
                  const isEditing =
                    editingCell?.row === ri && editingCell?.col === ci;
                  return (
                    <td
                      key={ci}
                      onClick={() => handleCellClick(ri, ci)}
                      onDoubleClick={() => handleCellDoubleClick(ri, ci)}
                      style={{
                        ...baseCellStyle,
                        ...(isSelected ? selectedCellStyle : {}),
                        ...(cell.error ? { color: "#EF5350", fontStyle: "italic" } : {}),
                      }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(ri, ci)}
                          onKeyDown={(e) => handleEditKeyDown(e, ri, ci)}
                          style={cellInputStyle}
                        />
                      ) : (
                        cell.error ||
                        (cell.value !== null ? cell.value : cell.raw)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row / column buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={addRow}
          style={{
            padding: "4px 14px",
            fontSize: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
          }}
        >
          + Row
        </button>
        <button
          onClick={addColumn}
          style={{
            padding: "4px 14px",
            fontSize: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
          }}
        >
          + Column
        </button>
      </div>

      {/* Chart */}
      {showChart && <DataChart data={data} chartType={chartType} />}
    </div>
  );
}

// Export grid factory for use in parent
export { createEmptyGrid };
