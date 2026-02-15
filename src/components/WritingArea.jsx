import React from 'react';
import { getWordCount, getCharCount } from "../utils/textAnalysis.js";

export default function WritingArea({ text, onTextChange }) {
  const wordCount = getWordCount(text);
  const charCount = getCharCount(text);

  return (
    <>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        padding: "0 4px",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "monospace" }}>
          📝 essay_final_FINAL_v3_REAL.docx
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            {wordCount} words • {charCount} chars
          </span>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={onTextChange}
        placeholder="Start writing your assignment here... Clippy is watching. Always watching. 👀"
        style={{
          width: "100%",
          minHeight: 340,
          padding: 20,
          fontSize: 15,
          lineHeight: 1.8,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.3)",
          color: "#E0E0E0",
          resize: "vertical",
          outline: "none",
          fontFamily: "'Georgia', serif",
          boxSizing: "border-box",
          transition: "border-color 0.3s",
        }}
        onFocus={(e) => e.target.style.borderColor = "rgba(156,39,176,0.4)"}
        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </>
  );
}
