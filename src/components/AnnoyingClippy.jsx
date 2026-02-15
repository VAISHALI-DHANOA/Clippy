import { useState, useCallback, useEffect, useRef } from "react";
import ClippyCharacter from "./ClippyCharacter.jsx";
import SpeechBubble from "./SpeechBubble.jsx";
import ApiKeyInput from "./ApiKeyInput.jsx";
import WritingArea from "./WritingArea.jsx";
import { useClippyReactions } from "../hooks/useClippyReactions.js";
import { useQuiz } from "../hooks/useQuiz.js";
import { useIdleDetection } from "../hooks/useIdleDetection.js";
import { CLIPPY_QUOTES, EXPRESSIONS } from "../data/quotes.js";
import { ANIMATION_STYLES } from "../styles/animations.js";

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

  // Random annoyance timer
  useEffect(() => {
    annoyTimerRef.current = setInterval(() => {
      if (Math.random() < 0.3) {
        triggerQuiz();
      } else {
        const msg = CLIPPY_QUOTES[Math.floor(Math.random() * CLIPPY_QUOTES.length)];
        const expr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)];
        showMessage(msg, expr);
      }
    }, 25000 + Math.random() * 15000);

    return () => clearInterval(annoyTimerRef.current);
  }, [showMessage, triggerQuiz]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    processTextChange(newText);
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

      {/* Main writing area */}
      <div style={{
        width: "100%",
        maxWidth: 720,
        position: "relative",
        zIndex: 1,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        padding: 24,
      }}>
        <ApiKeyInput
          reactionMode={reactionMode}
          setReactionMode={setReactionMode}
        />
        <WritingArea text={text} onTextChange={handleTextChange} />
      </div>

      {/* Clippy character */}
      {!isMinimized ? (
        <div style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
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
        </div>
      ) : (
        <div
          onClick={handleMinimize}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1000,
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
            animation: "clippyPulse 2s ease-in-out infinite",
          }}
        >
          📎
        </div>
      )}

      {/* Message counter badge */}
      {messageCount > 0 && (
        <div style={{
          position: "fixed",
          bottom: isMinimized ? 60 : 105,
          right: 20,
          zIndex: 1001,
          background: "#f44336",
          color: "white",
          borderRadius: "50%",
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(244,67,54,0.4)",
        }}>
          {messageCount > 99 ? "99+" : messageCount}
        </div>
      )}

      <style>{ANIMATION_STYLES}</style>
    </div>
  );
}
