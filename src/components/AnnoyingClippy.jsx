import { useState, useCallback, useEffect, useRef } from "react";
import ClippyCharacter from "./ClippyCharacter.jsx";
import SpeechBubble from "./SpeechBubble.jsx";
import WritingArea from "./WritingArea.jsx";
import SpreadsheetArea, { createEmptyGrid, serializeSpreadsheetForAI } from "./SpreadsheetArea.jsx";
import DashboardArea from "./DashboardArea.jsx";
import { useClippyReactions } from "../hooks/useClippyReactions.js";
import { useTextSuggestion } from "../hooks/useTextSuggestion.js";
import { useSpreadsheetReactions } from "../hooks/useSpreadsheetReactions.js";
import { useDashboardReactions } from "../hooks/useDashboardReactions.js";
import { useRealtimeVoice } from "../hooks/useRealtimeVoice.js";
import { ANIMATION_STYLES } from "../styles/animations.js";
import { getAIChat } from "../services/aiService.js";
import { WRITING_DEMO } from "../data/writingDemo.js";

const TABS = [
  { key: "writing", label: "Writing" },
  { key: "spreadsheet", label: "Spreadsheet" },
  { key: "dashboard", label: "Dashboard" },
];

export default function AnnoyingClippy() {
  const [activeTab, setActiveTab] = useState("writing");
  const [text, setText] = useState(WRITING_DEMO.text);
  const [documentName, setDocumentName] = useState(WRITING_DEMO.fileName);
  const [clippyMessage, setClippyMessage] = useState("Hi! I'm Clippy! I'm here to help. You cannot escape me.");
  const [expression, setExpression] = useState("happy");
  const [isVisible, setIsVisible] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [popupStyle, setPopupStyle] = useState("normal");
  const reactionMode = "ai";
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Spreadsheet state
  const [spreadsheetData, setSpreadsheetData] = useState(() => createEmptyGrid(10, 8));
  const [selectedCell, setSelectedCell] = useState(null);
  // Dashboard state
  const [dashboardPanels, setDashboardPanels] = useState([]);
  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1400
  );

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
  const { suggestion, clearSuggestion, acceptSuggestion } = useTextSuggestion(text);
  const { processDataChange } = useSpreadsheetReactions(showMessage);
  const { processDashboardChange } = useDashboardReactions(showMessage);

  // Realtime voice hook
  const {
    isConnected: voiceConnected,
    isConnecting: voiceConnecting,
    connect: connectVoice,
    disconnect: disconnectVoice,
    isUserSpeaking,
    isClippySpeaking,
    userTranscript,
    clippyTranscript,
    updateContext: updateVoiceContext,
    toggleMute,
    isMuted,
    error: voiceError,
  } = useRealtimeVoice();
  const voiceSupported = !!navigator.mediaDevices?.getUserMedia;
  const isCompactLayout = viewportWidth < 1100;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getDocumentContext = useCallback(() => {
    if (activeTab === "writing") return text;
    if (activeTab === "spreadsheet") return "SPREADSHEET DATA:\n" + serializeSpreadsheetForAI(spreadsheetData);
    return "DASHBOARD VIEW — SPREADSHEET DATA:\n" + serializeSpreadsheetForAI(spreadsheetData);
  }, [activeTab, text, spreadsheetData]);

  const handleMicClick = useCallback(() => {
    if (!voiceConnected) return;
    toggleMute();
  }, [voiceConnected, toggleMute]);

  const handleVoiceToggle = useCallback(() => {
    if (voiceEnabled) {
      disconnectVoice();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      connectVoice(getDocumentContext());
    }
  }, [voiceEnabled, disconnectVoice, connectVoice, getDocumentContext]);

  // Show Clippy's realtime transcript in the speech bubble when done speaking
  useEffect(() => {
    if (voiceEnabled && clippyTranscript && !isClippySpeaking) {
      showMessage(clippyTranscript, "sassy", "ai");
    }
  }, [isClippySpeaking, clippyTranscript, voiceEnabled, showMessage]);

  // Debounced context update for the Realtime session when document changes
  const contextUpdateTimer = useRef(null);
  useEffect(() => {
    if (!voiceEnabled || !voiceConnected) return;
    if (contextUpdateTimer.current) clearTimeout(contextUpdateTimer.current);
    contextUpdateTimer.current = setTimeout(() => {
      updateVoiceContext(getDocumentContext());
    }, 2000);
    return () => clearTimeout(contextUpdateTimer.current);
  }, [text, spreadsheetData, activeTab, voiceEnabled, voiceConnected, updateVoiceContext, getDocumentContext]);

  // Trigger spreadsheet AI reactions when data changes
  useEffect(() => {
    if (activeTab === "spreadsheet") {
      processDataChange(spreadsheetData, selectedCell);
    }
  }, [spreadsheetData, activeTab, selectedCell, processDataChange]);

  // Trigger dashboard AI reactions when panels or data change
  useEffect(() => {
    if (activeTab === "dashboard") {
      processDashboardChange(spreadsheetData, dashboardPanels);
    }
  }, [spreadsheetData, dashboardPanels, activeTab, processDashboardChange]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    processTextChange(newText);
  };

  const handleLoadDemoDraft = useCallback(() => {
    setText(WRITING_DEMO.text);
    setDocumentName(WRITING_DEMO.fileName);
    clearSuggestion();
    processTextChange(WRITING_DEMO.text);
    showMessage("Demo draft loaded. Pick one direction and push it hard.", "winking", "ai");
  }, [clearSuggestion, processTextChange, showMessage]);

  const handleStartBlankDraft = useCallback(() => {
    setText("");
    setDocumentName("untitled_argument_draft.md");
    clearSuggestion();
    showMessage("Blank page activated. No excuses now.", "mischievous");
  }, [clearSuggestion, showMessage]);

  const handleAcceptSuggestion = () => {
    const accepted = acceptSuggestion();
    if (accepted) {
      setText((prev) => prev + accepted);
    }
  };

  const handleDismiss = () => {
    setIsShaking(true);
    showMessage("You clicked dismiss? That's cute. I don't have a dismiss function.", "mischievous");
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      showMessage("Miss me? Of course you did.", "winking");
    } else {
      setIsMinimized(true);
    }
  };

  const handleChatSubmit = async (userMessage) => {
    if (!userMessage.trim() || isChatLoading) return;
    setIsChatLoading(true);
    setExpression("happy");
    setClippyMessage("Hmm, let me think...");

    // Send context based on active tab
    const context = activeTab === "writing"
      ? text
      : activeTab === "spreadsheet"
      ? "SPREADSHEET DATA:\n" + serializeSpreadsheetForAI(spreadsheetData)
      : "DASHBOARD VIEW — SPREADSHEET DATA:\n" + serializeSpreadsheetForAI(spreadsheetData);

    try {
      const reply = await getAIChat(context, userMessage);
      showMessage(reply || "I got nothing. Impressive.", "sassy", "ai");
    } catch {
      showMessage("I tried to think but my brain buffered. Try again!", "shocked");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #050510 0%, #1a1640 50%, #12121e 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      padding: isCompactLayout ? "16px 12px 20px" : "18px 18px 22px",
      position: "relative",
      overflowX: "hidden",
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
      <div style={{
        width: "100%",
        marginBottom: 12,
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
      }}>
        <h1 style={{
          fontSize: isCompactLayout ? 34 : 40,
          fontWeight: 800,
          color: "#fff",
          textShadow: "0 0 30px rgba(156,39,176,0.5), 0 0 60px rgba(156,39,176,0.2)",
          margin: 0,
          letterSpacing: "-0.5px",
        }}>
          📎 Clippy 2.0
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0, fontStyle: "italic" }}>
          Your uninvited AI study buddy • Now with 200% more unsolicited advice
        </p>
      </div>

      {/* Main content row */}
      <div style={{
        width: "100%",
        display: "flex",
        flexDirection: isCompactLayout ? "column" : "row",
        gap: isCompactLayout ? 12 : 16,
        alignItems: "stretch",
        flex: 1,
        minHeight: 0,
        position: "relative",
        zIndex: 1,
      }}>
        {/* Clippy side panel */}
        {!isMinimized ? (
          <div style={{
            width: isCompactLayout ? "100%" : 320,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            alignSelf: "flex-start",
            position: isCompactLayout ? "relative" : "sticky",
            top: isCompactLayout ? "auto" : 16,
            animation: isBouncing
              ? "clippyBounce 0.6s ease"
              : isShaking
              ? "clippyShake 0.5s ease"
              : isCompactLayout
              ? "none"
              : "clippyFloat 3s ease-in-out infinite",
          }}>
            {isVisible && (
              <SpeechBubble
                message={clippyMessage}
                popupStyle={popupStyle}
                onDismiss={handleDismiss}
                onMinimize={handleMinimize}
                onChatSubmit={handleChatSubmit}
                isChatLoading={isChatLoading}
                voiceEnabled={voiceEnabled}
                onVoiceToggle={handleVoiceToggle}
                isListening={isUserSpeaking}
                onMicClick={handleMicClick}
                isSpeaking={isClippySpeaking}
                voiceSupported={voiceSupported}
                voiceConnected={voiceConnected}
                voiceConnecting={voiceConnecting}
                isMuted={isMuted}
                userTranscript={userTranscript}
                voiceError={voiceError}
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
                fontSize: 13,
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
              width: isCompactLayout ? "100%" : 60,
              height: 60,
              borderRadius: isCompactLayout ? 14 : "50%",
              background: "linear-gradient(135deg, #7B1FA2, #512DA8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(123,31,162,0.4)",
              fontSize: 30,
              flexShrink: 0,
              animation: "clippyPulse 2s ease-in-out infinite",
            }}
          >
            📎
          </div>
        )}

        {/* Workspace panel */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {/* Tab bar */}
          <div style={{
            display: "flex",
            gap: 0,
            position: "relative",
            zIndex: 1,
          }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: isCompactLayout ? 1 : "0 0 auto",
                  padding: isCompactLayout ? "11px 12px" : "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderBottom: activeTab === tab.key
                    ? "2px solid #9C27B0"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === tab.key
                    ? "rgba(156,39,176,0.15)"
                    : "rgba(255,255,255,0.03)",
                  color: activeTab === tab.key
                    ? "#CE93D8"
                    : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  borderRadius: i === 0 ? "10px 0 0 0" : i === TABS.length - 1 ? "0 10px 0 0" : 0,
                  backdropFilter: "blur(10px)",
                  transition: "all 0.2s",
                }}
              >
                {tab.key === "writing" ? "📝 " : tab.key === "spreadsheet" ? "📊 " : "📈 "}{tab.label}
              </button>
            ))}
          </div>

          {/* Active workspace */}
          <div style={{
            flex: 1,
            minHeight: isCompactLayout ? 480 : "calc(100vh - 165px)",
            background: "rgba(0,0,0,0.35)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            padding: isCompactLayout ? 14 : 22,
            overflow: "hidden",
          }}>
            {activeTab === "writing" ? (
              <WritingArea
                text={text}
                onTextChange={handleTextChange}
                suggestion={suggestion}
                onAcceptSuggestion={handleAcceptSuggestion}
                onClearSuggestion={clearSuggestion}
                documentName={documentName}
                onLoadDemoDraft={handleLoadDemoDraft}
                onStartBlankDraft={handleStartBlankDraft}
                editorMinHeight={isCompactLayout ? 340 : "calc(100vh - 275px)"}
              />
            ) : activeTab === "spreadsheet" ? (
              <SpreadsheetArea
                data={spreadsheetData}
                onDataChange={setSpreadsheetData}
                selectedCell={selectedCell}
                onCellSelect={setSelectedCell}
              />
            ) : (
              <DashboardArea
                spreadsheetData={spreadsheetData}
                onPanelsChange={setDashboardPanels}
                compact={isCompactLayout}
              />
            )}
          </div>
        </div>
      </div>

      <style>{ANIMATION_STYLES}</style>
    </div>
  );
}
