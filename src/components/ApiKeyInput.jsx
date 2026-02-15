import React from 'react';

export default function ApiKeyInput({ reactionMode, setReactionMode }) {
  return (
    <div style={{
      marginBottom: 16,
      padding: 12,
      background: "rgba(156,39,176,0.1)",
      borderRadius: 8,
      border: "1px solid rgba(156,39,176,0.3)",
    }}>
      {/* Info Message */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
          🔑 API Key configured in <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>.env</code> file
        </span>
      </div>

      {/* Mode Toggle Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingTop: 10,
        borderTop: "1px solid rgba(255,255,255,0.1)"
      }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
          Reaction Mode:
        </span>

        {/* AI Button */}
        <button
          onClick={() => setReactionMode('ai')}
          style={{
            padding: "6px 16px",
            fontSize: 12,
            borderRadius: 6,
            border: reactionMode === 'ai' ? "2px solid #9C27B0" : "1px solid rgba(255,255,255,0.2)",
            background: reactionMode === 'ai' ? "rgba(156,39,176,0.3)" : "rgba(0,0,0,0.3)",
            color: "#E0E0E0",
            cursor: "pointer",
            fontWeight: reactionMode === 'ai' ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          ✨ AI Suggestions
        </button>

        {/* Regex Button */}
        <button
          onClick={() => setReactionMode('regex')}
          style={{
            padding: "6px 16px",
            fontSize: 12,
            borderRadius: 6,
            border: reactionMode === 'regex' ? "2px solid #FF9800" : "1px solid rgba(255,255,255,0.2)",
            background: reactionMode === 'regex' ? "rgba(255,152,0,0.3)" : "rgba(0,0,0,0.3)",
            color: "#E0E0E0",
            cursor: "pointer",
            fontWeight: reactionMode === 'regex' ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          🎯 Pattern-Based
        </button>

        <span style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontStyle: "italic",
          marginLeft: "auto"
        }}>
          {reactionMode === 'ai' && "✅ AI analyzing your writing"}
          {reactionMode === 'regex' && "Using keyword patterns"}
        </span>
      </div>
    </div>
  );
}
