import { useState, useCallback, useEffect, useRef } from "react";
import ClippyCharacter from "./ClippyCharacter.jsx";
import SpeechBubble from "./SpeechBubble.jsx";
import ApiKeyInput from "./ApiKeyInput.jsx";
import WritingArea from "./WritingArea.jsx";
import { useClippyReactions } from "../hooks/useClippyReactions.js";
import { useQuiz } from "../hooks/useQuiz.js";
import { useIdleDetection } from "../hooks/useIdleDetection.js";
import { useTextSuggestion } from "../hooks/useTextSuggestion.js";
import { CLIPPY_QUOTES, EXPRESSIONS } from "../data/quotes.js";
import { ANIMATION_STYLES } from "../styles/animations.js";
import { getAIChat } from "../services/aiService.js";

export default function AnnoyingClippy() {
  const [text, setText] = useState("");
  const [clippyMessage, setClippyMessage] = useState("Hi! I'm Clippy! I'm here to help. You cannot escape me. 📎");
  const [expression, setExpression] = useState("happy");
  const [isVisible, setIsVisible] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [popupStyle, setPopupStyle] = useState("normal");
  const [reactionMode, setReactionMode] = useState("ai"); // "ai" or "regex"
  const [isChatLoading, setIsChatLoading] = useState(false);
  const annoyTimerRef = useRef(null);

  const showMessage = useCallback((msg, expr = "sassy", style = "normal") => {
    setClippyMessage(msg);
    setExpression(expr);
    setPopupStyle(style);
    setMessageCount((c) => c + 1);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);
  }, []);

  // Custom hooks
  const { processTextChange } = useClippyReactions(showMessage, reactionMode);
  const { quizActive, currentQuiz, quizResult, triggerQuiz, handleQuizAnswer } = useQuiz(showMessage);
  useIdleDetection(text, showMessage);
  const { suggestion, clearSuggestion, acceptSuggestion } = useTextSuggestion(text);

  // Random annoyance timer — reduced frequency (60-90s)
  useEffect(() => {
    annoyTimerRef.current = setInterval(() => {
      if (Math.random() < 0.3) {
        triggerQuiz();
      } else {
        const msg = CLIPPY_QUOTES[Math.floor(Math.random() * CLIPPY_QUOTES.length)];
        const expr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)];
        showMessage(msg, expr);
      }
    }, 60000 + Math.random() * 30000);

    return () => clearInterval(annoyTimerRef.current);
  }, [showMessage, triggerQuiz]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    processTextChange(newText);
  };

  const handleAcceptSuggestion = () => {
    const accepted = acceptSuggestion();
    if (accepted) {
      setText((prev) => prev + accepted);
    }
  };

  const handleDismiss = () => {
    setIsShaking(true);
    showMessage("You clicked dismiss? That's cute. I don't have a dismiss function. 😈", "mischievous");
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      showMessage("Miss me? Of course you did. 💅", "winking");
    } else {
      setIsMinimized(true);
    }
  };

  const handleChatSubmit = async (userMessage) => {
    if (!userMessage.trim() || isChatLoading) return;
    setIsChatLoading(true);
    setExpression("happy");
    setClippyMessage("Hmm, let me think... 🤔");
    try {
      const reply = await getAIChat(text, userMessage);
      showMessage(reply || "I got nothing. Impressive.", "sassy", "ai");
    } catch {
      showMessage("I tried to think but my brain buffered. Try again! 😅", "shocked");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "30px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Retro grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.05,
        backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30, position: "relative", zIndex: 1 }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#fff",
          textShadow: "0 0 30px rgba(156,39,176,0.5), 0 0 60px rgba(156,39,176,0.2)",
          margin: 0,
          letterSpacing: "-0.5px",
        }}>
          📎 Clippy 2.0
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 6, fontStyle: "italic" }}>
          Your uninvited AI study buddy • Now with 200% more unsolicited advice
        </p>
      </div>

      {/* Main content row: writing area + Clippy side panel */}
      <div style={{
        width: "100%",
        maxWidth: 1060,
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Writing area */}
        <div style={{
          flex: 1,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          padding: 24,
          minWidth: 0,
        }}>
          <ApiKeyInput
            reactionMode={reactionMode}
            setReactionMode={setReactionMode}
          />
          <WritingArea
            text={text}
            onTextChange={handleTextChange}
            suggestion={suggestion}
            onAcceptSuggestion={handleAcceptSuggestion}
            onClearSuggestion={clearSuggestion}
          />
        </div>

        {/* Clippy side panel */}
        {!isMinimized ? (
          <div style={{
            width: 270,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            animation: isBouncing ? "clippyBounce 0.6s ease" : isShaking ? "clippyShake 0.5s ease" : "clippyFloat 3s ease-in-out infinite",
          }}>
            {isVisible && (
              <SpeechBubble
                message={clippyMessage}
                popupStyle={popupStyle}
                quizActive={quizActive}
                currentQuiz={currentQuiz}
                quizResult={quizResult}
                onQuizAnswer={handleQuizAnswer}
                onDismiss={handleDismiss}
                onMinimize={handleMinimize}
                onChatSubmit={handleChatSubmit}
                isChatLoading={isChatLoading}
              />
            )}

            <div
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onClick={() => setIsVisible(!isVisible)}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <ClippyCharacter expression={expression} />
            </div>

            {/* Message counter badge */}
            {messageCount > 0 && (
              <div style={{
                background: "#f44336",
                color: "white",
                borderRadius: 12,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(244,67,54,0.4)",
              }}>
                {messageCount} message{messageCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={handleMinimize}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7B1FA2, #512DA8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(123,31,162,0.4)",
              fontSize: 24,
              flexShrink: 0,
              animation: "clippyPulse 2s ease-in-out infinite",
            }}
          >
            📎
          </div>
        )}
      </div>

      <style>{ANIMATION_STYLES}</style>
    </div>
  );
}
