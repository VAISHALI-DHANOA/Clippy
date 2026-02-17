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
  voiceEnabled,
  onVoiceToggle,
  isListening,
  onMicClick,
  isSpeaking,
  voiceSupported,
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
          placeholder={
            isListening ? "Listening..." :
            isChatLoading ? "Clippy is thinking..." :
            "Ask Clippy anything..."
          }
          disabled={isChatLoading || isListening}
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 8,
            border: isListening
              ? "1px solid rgba(244,67,54,0.5)"
              : "1px solid rgba(92,107,192,0.4)",
            background: isListening
              ? "rgba(244,67,54,0.05)"
              : "rgba(255,255,255,0.85)",
            color: "#37474F",
            outline: "none",
            opacity: isChatLoading ? 0.6 : 1,
          }}
        />
        {voiceEnabled && (
          <button
            onClick={onMicClick}
            disabled={isChatLoading}
            style={{
              padding: "6px 10px",
              fontSize: 14,
              borderRadius: 8,
              border: "none",
              background: isListening ? "#f44336" : "#9C27B0",
              color: "white",
              cursor: isChatLoading ? "default" : "pointer",
              transition: "all 0.2s",
              animation: isListening ? "micPulse 1s ease-in-out infinite" : "none",
              minWidth: 34,
              opacity: isChatLoading ? 0.5 : 1,
            }}
          >
            {isListening ? "\u23F9" : "\uD83C\uDFA4"}
          </button>
        )}
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
          {isChatLoading ? "..." : "\u21B5"}
        </button>
      </div>

      {/* Action buttons + voice toggle */}
      <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
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

        {voiceSupported && (
          <>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 9, color: "#999" }}>Voice</span>
            <div
              onClick={onVoiceToggle}
              style={{
                width: 30,
                height: 15,
                borderRadius: 8,
                background: voiceEnabled ? "#9C27B0" : "#ccc",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: 2,
                left: voiceEnabled ? 17 : 2,
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
            {isSpeaking && (
              <span style={{ fontSize: 9, color: "#9C27B0", fontWeight: 600 }}>
                Speaking...
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
