import { useEffect, useRef } from "react";
import { IDLE_MESSAGES } from "../data/quotes.js";

export function useIdleDetection(text, showMessage) {
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const resetIdle = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
        showMessage(msg, "bored");
      }, 15000);
    };

    resetIdle();
    return () => clearTimeout(idleTimerRef.current);
  }, [text, showMessage]);
}
