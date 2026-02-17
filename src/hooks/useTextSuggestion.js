import { useState, useRef, useCallback, useEffect } from "react";
import { getTextSuggestion } from "../services/aiService.js";

export function useTextSuggestion(text) {
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const suggestionTimerRef = useRef(null);
  const lastRequestedTextRef = useRef("");

  const fetchSuggestion = useCallback(async (currentText) => {
    // Don't fetch if text is too short or hasn't changed
    if (currentText.length < 10 || currentText === lastRequestedTextRef.current) {
      return;
    }

    lastRequestedTextRef.current = currentText;
    setIsLoading(true);

    try {
      const newSuggestion = await getTextSuggestion(currentText);
      if (newSuggestion && currentText === lastRequestedTextRef.current) {
        setSuggestion(newSuggestion);
      }
    } catch (error) {
      console.error("Failed to fetch suggestion:", error);
      setSuggestion("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    clearTimeout(suggestionTimerRef.current);

    // Clear suggestion if text is too short
    if (text.length < 10) {
      setSuggestion("");
      return;
    }

    // Debounce: wait for user to stop typing
    suggestionTimerRef.current = setTimeout(() => {
      fetchSuggestion(text);
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(suggestionTimerRef.current);
  }, [text, fetchSuggestion]);

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
    lastRequestedTextRef.current = "";
  }, []);

  const acceptSuggestion = useCallback(() => {
    const accepted = suggestion;
    clearSuggestion();
    return accepted;
  }, [suggestion, clearSuggestion]);

  return {
    suggestion,
    isLoading,
    clearSuggestion,
    acceptSuggestion,
  };
}
