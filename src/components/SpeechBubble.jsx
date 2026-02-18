import { useState } from 'react';
import { BUBBLE_COLORS } from "../styles/animations.js";

export default function SpeechBubble({
  message,
  popupStyle,
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
      padding: "14px 18px",
      width: "100%",
      boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${bubbleColors.border}33`,
      position: "relative",
      animation: "fadeIn 0.3s ease",
    }}>
      <p style={{
        margin: 0,
        fontSize: 15,
        lineHeight: 1.6,
        color: "#E0E0E0",
        whiteSpace: "pre-line",
      }}>
        {message}
      </p>

      {/* Chat input */}
      <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
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
            padding: "8px 12px",
            fontSize: 14,
            borderRadius: 8,
            border: isListening
              ? "1px solid rgba(244,67,54,0.5)"
              : "1px solid rgba(156,39,176,0.3)",
            background: isListening
              ? "rgba(244,67,54,0.1)"
              : "rgba(255,255,255,0.08)",
            color: "#E0E0E0",
            outline: "none",
            opacity: isChatLoading ? 0.6 : 1,
          }}
        />
        {voiceEnabled && (
          <button
            onClick={onMicClick}
            disabled={isChatLoading}
            style={{
              padding: "8px 12px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: isListening ? "#f44336" : "#9C27B0",
              color: "white",
              cursor: isChatLoading ? "default" : "pointer",
              transition: "all 0.2s",
              animation: isListening ? "micPulse 1s ease-in-out infinite" : "none",
              minWidth: 38,
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
            padding: "8px 12px",
            fontSize: 14,
            borderRadius: 8,
            border: "none",
            background: isChatLoading || !chatInput.trim() ? "rgba(255,255,255,0.1)" : "#5C6BC0",
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
      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        <button
          onClick={onDismiss}
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
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
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
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
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Voice</span>
            <div
              onClick={onVoiceToggle}
              style={{
                width: 36,
                height: 18,
                borderRadius: 9,
                background: voiceEnabled ? "#9C27B0" : "rgba(255,255,255,0.15)",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: 2,
                left: voiceEnabled ? 20 : 2,
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </div>
            {isSpeaking && (
              <span style={{ fontSize: 11, color: "#CE93D8", fontWeight: 600 }}>
                Speaking...
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
