import { useState, useRef, useCallback, useEffect } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const selectedVoiceRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" && !!window.speechSynthesis;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      if (available.length === 0) return;

      // Pick a voice that fits Clippy's personality
      const priorities = [
        (v) => v.name.includes("Google UK English Male"),
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male"),
        (v) => v.lang.startsWith("en"),
      ];

      for (const test of priorities) {
        const match = available.find(test);
        if (match) {
          selectedVoiceRef.current = match;
          return;
        }
      }
      // Fallback: first available voice
      selectedVoiceRef.current = available[0];
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback(
    (text) => {
      if (!isSupported || !text) return;

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSpeaking, isSupported, speak, stop };
}
