import { useEffect, useMemo, useState } from 'react';
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
  voiceConnected,
  voiceConnecting,
  isMuted,
  userTranscript,
  voiceError,
}) {
  const [chatInput, setChatInput] = useState("");
  const [cardFeedback, setCardFeedback] = useState({});
  const bubbleColors = BUBBLE_COLORS[popupStyle] || BUBBLE_COLORS.normal;

  useEffect(() => {
    setCardFeedback({});
  }, [message]);
  const structuredMessage = useMemo(() => {
    if (popupStyle !== "ai") return null;
    const lines = String(message || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 1) return null;

    const parsed = lines.map((line) => {
      const match = line.match(/^(\S+)\s+([^:]+):\s*(.+)$/u);
      if (!match) return null;
      return {
        icon: match[1],
        heading: match[2].trim(),
        body: match[3].trim(),
      };
    });

    return parsed.every(Boolean) ? parsed : null;
  }, [message, popupStyle]);

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
      {structuredMessage ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {structuredMessage.map((item, idx) => (
            <div
              key={`${item.heading}-${idx}`}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 3,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                <span style={{
                  fontSize: 11,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "rgba(206,147,216,0.95)",
                }}>
                  {item.heading}
                </span>
              </div>
              <div style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.45,
                color: "#E0E0E0",
              }}>
                {item.body}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {["Useful", "Not useful", "Less like this"].map((label) => {
                  const key = `${idx}:${label}`;
                  const active = cardFeedback[idx] === label;
                  return (
                    <button
                      key={key}
                      onClick={() => setCardFeedback((prev) => ({ ...prev, [idx]: label }))}
                      style={{
                        padding: "3px 7px",
                        borderRadius: 999,
                        border: active
                          ? "1px solid rgba(156,39,176,0.85)"
                          : "1px solid rgba(255,255,255,0.2)",
                        background: active
                          ? "rgba(156,39,176,0.2)"
                          : "rgba(255,255,255,0.03)",
                        color: active ? "#E1BEE7" : "rgba(255,255,255,0.55)",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{
          margin: 0,
          fontSize: 15,
          lineHeight: 1.6,
          color: "#E0E0E0",
          whiteSpace: "pre-line",
        }}>
          {message}
        </p>
      )}

      {/* Live user transcript */}
      {voiceEnabled && voiceConnected && userTranscript && (
        <div style={{
          marginTop: 8,
          padding: "4px 8px",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          fontStyle: "italic",
          borderLeft: "2px solid rgba(156,39,176,0.4)",
        }}>
          You said: &ldquo;{userTranscript}&rdquo;
        </div>
      )}

      {/* Chat input */}
      <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            voiceConnecting ? "Connecting voice..." :
            voiceConnected && !isMuted ? "Speak or type to Clippy..." :
            isChatLoading ? "Clippy is thinking..." :
            "Ask Clippy anything..."
          }
          disabled={isChatLoading}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 14,
            borderRadius: 8,
            border: isListening
              ? "1px solid rgba(76,175,80,0.5)"
              : "1px solid rgba(156,39,176,0.3)",
            background: isListening
              ? "rgba(76,175,80,0.1)"
              : "rgba(255,255,255,0.08)",
            color: "#E0E0E0",
            outline: "none",
            opacity: isChatLoading ? 0.6 : 1,
          }}
        />
        {voiceEnabled && (
          <button
            onClick={onMicClick}
            disabled={!voiceConnected}
            style={{
              padding: "8px 12px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: voiceConnecting ? "#666"
                : isMuted ? "#f44336"
                : isListening ? "#4CAF50"
                : "#9C27B0",
              color: "white",
              cursor: voiceConnected ? "pointer" : "default",
              transition: "all 0.2s",
              animation: isListening ? "micPulse 1s ease-in-out infinite" : "none",
              minWidth: 38,
              opacity: voiceConnected ? 1 : 0.5,
            }}
          >
            {voiceConnecting ? "..." : isMuted ? "\uD83D\uDD07" : "\uD83C\uDFA4"}
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
            {voiceConnecting && (
              <span style={{ fontSize: 11, color: "#FFB74D", fontWeight: 600 }}>
                Connecting...
              </span>
            )}
            {isSpeaking && !voiceConnecting && (
              <span style={{ fontSize: 11, color: "#CE93D8", fontWeight: 600 }}>
                Speaking...
              </span>
            )}
            {voiceError && !voiceConnecting && (
              <span style={{ fontSize: 11, color: "#f44336", fontWeight: 600 }}>
                Voice error
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
