import { useRef, useCallback } from 'react';
import { getWordCount, getCharCount } from "../utils/textAnalysis.js";

export default function WritingArea({
  text,
  onTextChange,
  suggestion,
  onAcceptSuggestion,
  onClearSuggestion,
  documentName,
  onLoadDemoDraft,
  onStartBlankDraft,
}) {
  const wordCount = getWordCount(text);
  const charCount = getCharCount(text);
  const textareaRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      onAcceptSuggestion();
    } else if (suggestion && e.key !== 'Tab') {
      // Clear suggestion when user types anything else
      onClearSuggestion();
    }
  }, [suggestion, onAcceptSuggestion, onClearSuggestion]);

  return (
    <>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        padding: "0 4px",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "monospace" }}>
          📝 {documentName}
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onLoadDemoDraft}
            style={{
              background: "rgba(92,107,192,0.25)",
              color: "#D1D9FF",
              border: "1px solid rgba(92,107,192,0.5)",
              borderRadius: 6,
              padding: "4px 9px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Load demo draft
          </button>
          <button
            onClick={onStartBlankDraft}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "4px 9px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Start blank
          </button>
          {suggestion && (
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic" }}>
              Press Tab to accept suggestion
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            {wordCount} words • {charCount} chars
          </span>
        </div>
      </div>

      {/* Textarea with suggestion overlay */}
      <div style={{ position: "relative" }}>
        {/* Suggestion overlay */}
        {suggestion && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: 20,
              fontSize: 17,
              lineHeight: 1.8,
              fontFamily: "'Georgia', serif",
              color: "transparent",
              pointerEvents: "none",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {text}
            <span style={{ color: "rgba(128,128,128,0.5)" }}>
              {suggestion}
            </span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={onTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your assignment here... Clippy is watching. Always watching. 👀"
          style={{
            width: "100%",
            minHeight: 400,
            padding: 22,
            fontSize: 17,
            lineHeight: 1.8,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.4)",
            color: "#E0E0E0",
            resize: "vertical",
            outline: "none",
            fontFamily: "'Georgia', serif",
            boxSizing: "border-box",
            transition: "border-color 0.3s",
            position: "relative",
          }}
          onFocus={(e) => e.target.style.borderColor = "rgba(156,39,176,0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
      </div>
    </>
  );
}
