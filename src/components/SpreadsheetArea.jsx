import { useState, useCallback, useEffect, useRef } from "react";
import SpreadsheetToolbar from "./SpreadsheetToolbar.jsx";
import DataChart from "./DataChart.jsx";
import { getCellSuggestion } from "../services/aiService.js";

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
  padding: "5px 10px",
  minWidth: 90,
  height: 32,
  color: "#E0E0E0",
  background: "rgba(0,0,0,0.35)",
  cursor: "cell",
  textAlign: "right",
  fontSize: 15,
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
  background: "rgba(156,39,176,0.12)",
  color: "rgba(255,255,255,0.6)",
  padding: "5px 10px",
  fontSize: 13,
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
  fontSize: 15,
  fontFamily: "monospace",
  textAlign: "right",
  outline: "none",
  position: "relative",
  zIndex: 1,
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
  const [cellSuggestion, setCellSuggestion] = useState("");
  const [chartLabelCol, setChartLabelCol] = useState(null);
  const [chartDataCols, setChartDataCols] = useState([]);
  const tableRef = useRef(null);
  const suggestionTimerRef = useRef(null);
  const lastSuggestRequestRef = useRef("");

  const columns = Array.from({ length: data[0].length }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  // Fetch cell suggestion when editing pauses
  useEffect(() => {
    clearTimeout(suggestionTimerRef.current);
    setCellSuggestion("");

    if (!editingCell) return;

    // Need at least some data in the grid to give context
    const hasData = data.flat().some((c) => c.raw.trim() !== "");
    if (!hasData) return;

    const ref = toCellRef(editingCell.row, editingCell.col);
    const requestKey = `${ref}:${editValue}`;
    if (requestKey === lastSuggestRequestRef.current) return;

    suggestionTimerRef.current = setTimeout(async () => {
      lastSuggestRequestRef.current = requestKey;
      try {
        const tableText = serializeSpreadsheetForAI(data);
        const suggestion = await getCellSuggestion(tableText, ref, editValue);
        if (suggestion && suggestion !== editValue) {
          setCellSuggestion(suggestion);
        }
      } catch {
        // ignore
      }
    }, 800);

    return () => clearTimeout(suggestionTimerRef.current);
  }, [editingCell, editValue, data]);

  const commitEdit = useCallback(
    (row, col) => {
      setEditingCell(null);
      setCellSuggestion("");
      const newData = data.map((r) => r.map((c) => ({ ...c })));
      newData[row][col].raw = editValue;
      recalculate(newData);
      onDataChange(newData);
    },
    [data, editValue, onDataChange]
  );

  // Single click: select + enter edit mode immediately
  const handleCellClick = (row, col) => {
    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
      commitEdit(editingCell.row, editingCell.col);
    }
    onCellSelect({ row, col });
    setEditingCell({ row, col });
    setEditValue(data[row][col].raw);
    setCellSuggestion("");
  };

  const handleEditKeyDown = (e, row, col) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (cellSuggestion) {
        // Accept suggestion and commit
        const newData = data.map((r) => r.map((c) => ({ ...c })));
        newData[row][col].raw = cellSuggestion;
        recalculate(newData);
        onDataChange(newData);
        setEditingCell(null);
        setCellSuggestion("");
      } else {
        commitEdit(row, col);
      }
      // Move to next cell and auto-edit
      const nextCol = col + 1 < data[0].length ? col + 1 : 0;
      const nextRow =
        col + 1 < data[0].length ? row : Math.min(row + 1, data.length - 1);
      onCellSelect({ row: nextRow, col: nextCol });
      setEditingCell({ row: nextRow, col: nextCol });
      setEditValue(data[nextRow][nextCol].raw);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cellSuggestion) {
        const newData = data.map((r) => r.map((c) => ({ ...c })));
        newData[row][col].raw = cellSuggestion;
        recalculate(newData);
        onDataChange(newData);
        setEditingCell(null);
        setCellSuggestion("");
      } else {
        commitEdit(row, col);
      }
      // Move down and auto-edit
      const nextRow = Math.min(row + 1, data.length - 1);
      onCellSelect({ row: nextRow, col });
      setEditingCell({ row: nextRow, col });
      setEditValue(data[nextRow][col].raw);
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
      setCellSuggestion("");
    } else if (e.key === "ArrowUp" && !editValue) {
      e.preventDefault();
      commitEdit(row, col);
      const nextRow = Math.max(row - 1, 0);
      onCellSelect({ row: nextRow, col });
      setEditingCell({ row: nextRow, col });
      setEditValue(data[nextRow][col].raw);
    } else if (e.key === "ArrowDown" && !editValue) {
      e.preventDefault();
      commitEdit(row, col);
      const nextRow = Math.min(row + 1, data.length - 1);
      onCellSelect({ row: nextRow, col });
      setEditingCell({ row: nextRow, col });
      setEditValue(data[nextRow][col].raw);
    } else {
      // Typing clears the current suggestion
      if (cellSuggestion) setCellSuggestion("");
    }
  };

  // Keyboard nav when table has focus but no cell is editing
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
        setEditingCell({ row, col });
        setEditValue(e.key);
      }
    },
    [editingCell, selectedCell, data, onCellSelect, onDataChange]
  );

  // Paste from external spreadsheet (tab-separated rows)
  const handlePaste = useCallback(
    (e) => {
      const anchor = editingCell || selectedCell;
      if (!anchor) return;

      const clipText = e.clipboardData.getData("text/plain");
      if (!clipText) return;

      // Parse rows (newline-separated) and cols (tab-separated)
      const pasteRows = clipText
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .filter((line, i, arr) => !(i === arr.length - 1 && line === ""));
      const pasteGrid = pasteRows.map((row) => row.split("\t"));

      // If it's a single value and we're editing, let the input handle it
      if (pasteGrid.length === 1 && pasteGrid[0].length === 1 && editingCell) {
        return; // let default paste into input happen
      }

      e.preventDefault();

      // Expand grid if paste extends beyond current bounds
      const neededRows = anchor.row + pasteGrid.length;
      const neededCols = anchor.col + Math.max(...pasteGrid.map((r) => r.length));

      let newData = data.map((r) => r.map((c) => ({ ...c })));

      // Add rows if needed
      while (newData.length < neededRows) {
        newData.push(
          Array.from({ length: newData[0].length }, () => ({
            raw: "",
            value: null,
            error: null,
          }))
        );
      }

      // Add columns if needed
      if (neededCols > newData[0].length) {
        const extraCols = neededCols - newData[0].length;
        newData = newData.map((row) => [
          ...row,
          ...Array.from({ length: extraCols }, () => ({
            raw: "",
            value: null,
            error: null,
          })),
        ]);
      }

      // Fill in pasted values
      for (let r = 0; r < pasteGrid.length; r++) {
        for (let c = 0; c < pasteGrid[r].length; c++) {
          const targetRow = anchor.row + r;
          const targetCol = anchor.col + c;
          if (targetRow < newData.length && targetCol < newData[0].length) {
            newData[targetRow][targetCol].raw = pasteGrid[r][c];
          }
        }
      }

      recalculate(newData);
      onDataChange(newData);

      // Exit edit mode if we were editing
      if (editingCell) {
        setEditingCell(null);
        setCellSuggestion("");
      }
    },
    [editingCell, selectedCell, data, onDataChange]
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <SpreadsheetToolbar
        selectedCell={selectedCell}
        cellRaw={selectedCellRaw}
        onFormulaSubmit={handleFormulaSubmit}
        showChart={showChart}
        onToggleChart={() => setShowChart((v) => !v)}
        chartType={chartType}
        onChartTypeChange={setChartType}
      />

      {/* Suggestion hint */}
      {cellSuggestion && editingCell && (
        <div style={{
          padding: "4px 10px",
          marginBottom: 6,
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          fontStyle: "italic",
        }}>
          Press Tab to accept suggestion
        </div>
      )}

      {/* Scrollable grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: "calc(100vh - 330px)",
          overflowY: "auto",
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <table
          ref={tableRef}
          tabIndex={0}
          onKeyDown={handleTableKeyDown}
          onPaste={handlePaste}
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
                  const showGhost = isEditing && cellSuggestion;
                  return (
                    <td
                      key={ci}
                      onClick={() => handleCellClick(ri, ci)}
                      style={{
                        ...baseCellStyle,
                        ...(isSelected ? selectedCellStyle : {}),
                        ...(cell.error
                          ? { color: "#EF5350", fontStyle: "italic" }
                          : {}),
                      }}
                    >
                      {isEditing ? (
                        <div style={{ position: "relative", width: "100%", height: "100%" }}>
                          {/* Ghost suggestion text */}
                          {showGhost && (
                            <span
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                color: "rgba(156,39,176,0.4)",
                                fontSize: 15,
                                fontFamily: "monospace",
                                pointerEvents: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cellSuggestion}
                            </span>
                          )}
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(ri, ci)}
                            onKeyDown={(e) => handleEditKeyDown(e, ri, ci)}
                            style={cellInputStyle}
                          />
                        </div>
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
            fontSize: 14,
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
            fontSize: 14,
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
      {showChart && (
        <DataChart
          data={data}
          chartType={chartType}
          labelCol={chartLabelCol}
          chartCols={chartDataCols}
          onLabelColChange={setChartLabelCol}
          onChartColsChange={setChartDataCols}
        />
      )}
    </div>
  );
}

export { createEmptyGrid };
