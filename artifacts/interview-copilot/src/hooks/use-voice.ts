import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      setIsSupported(true);

      return () => {
        try {
          recognitionRef.current?.stop();
        } catch (_) {}
      };
    } catch (err) {
      console.warn("SpeechRecognition not available:", err);
      setIsSupported(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Could not start recording", e);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setIsRecording(false);
    try {
      recognitionRef.current.stop();
    } catch (_) {}
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    transcript,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
    setTranscript
  };
}
