import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom React hook for robust, leak-free Web Speech API recognition.
 * Addresses:
 * - Fresh SpeechRecognition instance on every session start.
 * - Explicit buffer clearance and event listener teardown on stop/abort.
 * - Full cleanup on component unmount.
 * - Loop strictly from event.resultIndex to prevent duplicate accumulation.
 * - Debounces finalized speech processing.
 * - Handles mic permission denied, no-speech, and unsupported browser gracefully.
 */
export function useVoiceRecognition({
  onFinalSpeech,
  onInterimSpeech,
  lang = "en-IN",
  debounceMs = 300,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const onFinalSpeechRef = useRef(onFinalSpeech);
  const onInterimSpeechRef = useRef(onInterimSpeech);

  // Keep callback refs fresh without re-triggering effects
  useEffect(() => {
    onFinalSpeechRef.current = onFinalSpeech;
  }, [onFinalSpeech]);

  useEffect(() => {
    onInterimSpeechRef.current = onInterimSpeech;
  }, [onInterimSpeech]);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const cleanupSession = useCallback((rec) => {
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.onstart = null;
    try {
      rec.abort();
    } catch {
      // Safe ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      cleanupSession(recognitionRef.current);
      recognitionRef.current = null;
    }

    setIsListening(false);
    setInterimText("");
  }, [cleanupSession]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // 1. Teardown any prior instance and clear buffers
    stopListening();
    setError(null);
    setInterimText("");
    setFinalText("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let currentInterim = "";

      // Strictly loop from event.resultIndex to prevent re-joining past results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptChunk = result[0]?.transcript || "";

        if (result.isFinal) {
          const trimmed = transcriptChunk.trim();
          if (trimmed) {
            setFinalText(trimmed);
            setInterimText("");

            // Debounce processing of final result
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
              if (onFinalSpeechRef.current) {
                onFinalSpeechRef.current(trimmed);
              }
            }, debounceMs);
          }
        } else {
          currentInterim += transcriptChunk;
        }
      }

      setInterimText(currentInterim);
      if (onInterimSpeechRef.current) {
        onInterimSpeechRef.current(currentInterim);
      }
    };

    recognition.onerror = (event) => {
      console.warn("SpeechRecognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission was denied. Please allow microphone access in your browser settings.");
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // No speech detected in timeframe; keep listening or silence warning
      } else if (event.error === "audio-capture") {
        setError("No microphone detected. Please check your audio input settings.");
        setIsListening(false);
      } else if (event.error === "network") {
        setError("Network error in speech recognition service. Please check your internet connection.");
        setIsListening(false);
      } else if (event.error === "aborted") {
        // Normal stop/abort triggered by user
      } else {
        setError(`Voice recognition notice: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start microphone. Please try again.");
      setIsListening(false);
    }
  }, [isSupported, lang, debounceMs, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isSupported,
    interimText,
    finalText,
    error,
    startListening,
    stopListening,
    toggleListening,
    reset: () => {
      setInterimText("");
      setFinalText("");
      setError(null);
    }
  };
}
