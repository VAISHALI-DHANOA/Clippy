export default function ApiKeyInput({ apiKey, setApiKey }) {
  return (
    <div style={{
      marginBottom: 16,
      padding: 12,
      background: "rgba(156,39,176,0.1)",
      borderRadius: 8,
      border: "1px solid rgba(156,39,176,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
          🤖 AI Mode {apiKey ? "✅" : "⚠️"}
        </span>
        <input
          type="password"
          placeholder="Enter Claude API key for smart reactions (optional)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.3)",
            color: "#E0E0E0",
            outline: "none",
          }}
        />
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontStyle: "italic" }}>
          {apiKey ? "Smart reactions active" : "Using basic reactions only"}
        </span>
      </div>
    </div>
  );
}
