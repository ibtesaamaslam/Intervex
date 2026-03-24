import { useState, useCallback, useRef, useEffect } from "react";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== "undefined" && !!window.speechSynthesis;
  const onEndRef = useRef<(() => void) | null>(null);

  // Trigger voice list load (async in Chrome)
  useEffect(() => {
    if (!isSupported) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, [isSupported]);

  const speak = useCallback(
    (text: string, { rate = 0.93, pitch = 1.05, onEnd }: { rate?: number; pitch?: number; onEnd?: () => void } = {}) => {
      if (!isSupported) { onEnd?.(); return; }
      window.speechSynthesis.cancel();
      onEndRef.current = onEnd ?? null;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      const pick = (names: string[]) => voices.find(v => names.some(n => v.name.includes(n)));
      const voice =
        pick(["Samantha", "Karen", "Moira"]) ||
        pick(["Google US English", "Google UK English Female", "Google UK English Male"]) ||
        pick(["Daniel", "Alex"]) ||
        voices.find(v => v.lang.startsWith("en") && v.localService) ||
        voices.find(v => v.lang.startsWith("en")) ||
        null;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        const cb = onEndRef.current;
        onEndRef.current = null;
        cb?.();
      };
      utterance.onerror = (e) => {
        if (e.error === "interrupted") return;
        setIsSpeaking(false);
        const cb = onEndRef.current;
        onEndRef.current = null;
        cb?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onEndRef.current = null;
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
