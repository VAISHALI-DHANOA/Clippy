import { useState, useRef, useCallback, useEffect } from "react";

const SESSION_URL = "http://localhost:3003/api/realtime-session";
const REALTIME_URL = "https://api.openai.com/v1/realtime";
const MODEL = "gpt-4o-mini-realtime-preview";

function buildInstructions(context) {
  let instructions =
    "You are Clippy, a sassy AI assistant. Answer the user's question in 1 sentence. Be witty and useful. Never ramble.";
  if (context) {
    instructions += `\n\nThe user is currently working on a document. Here is the current content for context:\n\n${context.slice(-800)}`;
  }
  return instructions;
}

export function useRealtimeVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isClippySpeaking, setIsClippySpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [clippyTranscript, setClippyTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const audioElRef = useRef(null);
  const streamRef = useRef(null);

  function disconnectInternal() {
    if (dcRef.current) {
      try { dcRef.current.close(); } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsUserSpeaking(false);
    setIsClippySpeaking(false);
    setIsMuted(false);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnectInternal();
  }, []);

  function handleServerEvent(event) {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsUserSpeaking(true);
        break;

      case "input_audio_buffer.speech_stopped":
        setIsUserSpeaking(false);
        break;

      case "conversation.item.input_audio_transcription.completed":
        setUserTranscript(event.transcript || "");
        break;

      case "response.created":
        setClippyTranscript("");
        setIsClippySpeaking(true);
        break;

      case "response.audio_transcript.delta":
        setClippyTranscript((prev) => prev + (event.delta || ""));
        break;

      case "response.done":
        setIsClippySpeaking(false);
        break;

      case "error":
        console.error("Realtime API error:", event.error);
        setError(event.error?.message || "Realtime API error");
        break;

      default:
        break;
    }
  }

  const connect = useCallback(async (context) => {
    if (pcRef.current || isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Get ephemeral token from backend
      const instructions = buildInstructions(context);
      const tokenRes = await fetch(SESSION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions, voice: "shimmer" }),
      });
      if (!tokenRes.ok) {
        throw new Error("Failed to get realtime session token");
      }
      const { clientSecret } = await tokenRes.json();

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 4. Add local audio track (microphone)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 5. Handle remote audio (Clippy's voice)
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      // 6. Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError("Voice connection lost");
          disconnectInternal();
        }
      };

      // 7. Create data channel for Realtime API events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      dc.onmessage = (event) => {
        try {
          handleServerEvent(JSON.parse(event.data));
        } catch (err) {
          console.error("Error parsing Realtime event:", err);
        }
      };

      dc.onclose = () => {
        setIsConnected(false);
      };

      // 8. Create SDP offer and send to OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(`${REALTIME_URL}?model=${MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        throw new Error("WebRTC SDP negotiation failed");
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      console.error("Realtime voice connection error:", err);
      setError(err.message);
      disconnectInternal();
    }
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    disconnectInternal();
  }, []);

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const updateContext = useCallback((context) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    const instructions = buildInstructions(context);
    dcRef.current.send(
      JSON.stringify({
        type: "session.update",
        session: { instructions },
      })
    );
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    isUserSpeaking,
    isClippySpeaking,
    userTranscript,
    clippyTranscript,
    updateContext,
    toggleMute,
    isMuted,
    error,
  };
}
