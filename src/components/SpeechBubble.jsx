import { useState } from 'react';
import { BUBBLE_COLORS } from "../styles/animations.js";

export default function SpeechBubble({
  message,
  popupStyle,
  quizActive,
  currentQuiz,
  quizResult,
  onQuizAnswer,
  onDismiss,
  onMinimize,
  onChatSubmit,
  isChatLoading,
}) {
  const [chatInput, setChatInput] = useState("");
  const bubbleColors = BUBBLE_COLORS[popupStyle] || BUBBLE_COLORS.normal;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  };

  const submitChat = () => {
    if (!chatInput.trim() || isChatLoading) return;
    onChatSubmit(chatInput.trim());
    setChatInput("");
  };

  return (
    <div style={{
      background: bubbleColors.bg,
      border: `2px solid ${bubbleColors.border}`,
      borderRadius: "16px 16px 16px 4px",
      padding: "12px 16px",
      width: "100%",
      boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 15px ${bubbleColors.border}33`,
      position: "relative",
      animation: "fadeIn 0.3s ease",
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        lineHeight: 1.5,
        color: "#37474F",
        whiteSpace: "pre-line",
      }}>
        {message}
      </p>

      {/* Quiz options */}
      {quizActive && currentQuiz && !quizResult && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {currentQuiz.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onQuizAnswer(opt)}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #5C6BC0",
                background: "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                color: "#37474F",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#5C6BC0";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.color = "#37474F";
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Chat input */}
      <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isChatLoading ? "Clippy is thinking..." : "Ask Clippy anything..."}
          disabled={isChatLoading}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid rgba(92,107,192,0.4)",
            background: "rgba(255,255,255,0.85)",
            color: "#37474F",
            outline: "none",
            opacity: isChatLoading ? 0.6 : 1,
          }}
        />
        <button
          onClick={submitChat}
          disabled={isChatLoading || !chatInput.trim()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 8,
            border: "none",
            background: isChatLoading || !chatInput.trim() ? "#ccc" : "#5C6BC0",
            color: "white",
            cursor: isChatLoading || !chatInput.trim() ? "default" : "pointer",
            transition: "background 0.2s",
            fontWeight: 600,
          }}
        >
          {isChatLoading ? "..." : "↵"}
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          onClick={onDismiss}
          style={{
            fontSize: 10,
            color: "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Dismiss (lol good luck)
        </button>
        <button
          onClick={onMinimize}
          style={{
            fontSize: 10,
            color: "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Minimize
        </button>
      </div>
    </div>
  );
}
