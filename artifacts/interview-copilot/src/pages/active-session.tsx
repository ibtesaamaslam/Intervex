import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AnalysisResult, type GeneratedQuestion } from "@/lib/api";
import { useVoiceRecording } from "@/hooks/use-voice";
import { useTTS } from "@/hooks/use-tts";
import { useToast } from "@/hooks/use-toast";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { cn, getScoreColor } from "@/lib/utils";
import {
  Mic, Square, Send, Loader2, AlertCircle, CheckCircle2,
  Lightbulb, ArrowRight, Trophy, XCircle, Star, Columns2,
  AlignLeft, Volume2, VolumeX, BookOpen, ChevronRight, Flag
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/* Persona config                                               */
/* ─────────────────────────────────────────────────────────── */
const PERSONAS = {
  friendly: {
    name: "Alex",
    title: "Senior Interviewer",
    color: "from-emerald-500/30 to-teal-600/20",
    ring: "ring-emerald-400/40",
    dot: "bg-emerald-400",
    wave: "bg-emerald-400",
    badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    intro: (role: string, company: string | null) =>
      `Hi there! Great to meet you. I'm Alex, and I'll be your interviewer today. We'll be going through a series of questions for the ${role} position${company ? ` at ${company}` : ""}. Take your time with each answer — there's no rush. I'm here to help you do your best. Ready? Let's jump right in with your first question.`,
    reviewLine: (score: number, fb: string) =>
      `Thanks for that answer. You scored ${score.toFixed(1)} out of ten. ${fb} Let's keep the momentum going.`,
    nextLine: (n: number) =>
      ["Excellent! Here comes your next question.", `Great — moving on to question ${n}.`, "Alright, let's continue.", `Here's question ${n}.`][n % 4],
  },
  tough: {
    name: "Morgan",
    title: "Principal Interviewer",
    color: "from-rose-600/30 to-red-700/20",
    ring: "ring-rose-400/40",
    dot: "bg-rose-400",
    wave: "bg-rose-400",
    badge: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    intro: (role: string, company: string | null) =>
      `Good day. I'm Morgan. We're conducting a rigorous evaluation for the ${role} position${company ? ` at ${company}` : ""}. I expect concise, well-structured answers backed by real evidence. Vague responses won't score well. Let's begin immediately. First question:`,
    reviewLine: (score: number, fb: string) =>
      `Hmm. Score: ${score.toFixed(1)} out of ten. ${fb} Next.`,
    nextLine: (n: number) =>
      [`Question ${n}.`, "Next question:", "Moving on.", `Proceed. Question ${n}:`][n % 4],
  },
  technical: {
    name: "Taylor",
    title: "Senior Technical Interviewer",
    color: "from-blue-600/30 to-indigo-700/20",
    ring: "ring-blue-400/40",
    dot: "bg-blue-400",
    wave: "bg-blue-400",
    badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    intro: (role: string, company: string | null) =>
      `Hello. I'm Taylor, a senior technical interviewer${company ? ` evaluating candidates for ${company}` : ""}. We'll assess your technical depth for the ${role} role. I care about precision, reasoning, and real implementation knowledge — not surface-level answers. No fluff. Here's question one.`,
    reviewLine: (score: number, fb: string) =>
      `Technical assessment: ${score.toFixed(1)} out of ten. ${fb} Proceeding.`,
    nextLine: (n: number) =>
      [`Proceeding to question ${n}.`, "Next technical question:", `Question ${n}:`, "Moving forward."
      ][n % 4],
  },
};

type Phase = "loading" | "intro" | "question" | "answering" | "analyzing" | "feedback" | "ending";

/* ─────────────────────────────────────────────────────────── */
/* Speaking waveform                                            */
/* ─────────────────────────────────────────────────────────── */
const BARS = [0.4, 0.9, 0.6, 1, 0.7, 1.1, 0.5, 0.95, 0.65, 1, 0.45, 0.8];
function SpeakingWave({ active, colorClass }: { active: boolean; colorClass: string }) {
  return (
    <div className="flex items-center gap-[3px] h-7">
      {BARS.map((intensity, i) => (
        <motion.div
          key={i}
          className={cn("w-[3px] rounded-full", colorClass)}
          animate={active
            ? { height: [`${intensity * 6}px`, `${intensity * 26}px`, `${intensity * 6}px`] }
            : { height: "3px" }
          }
          transition={active
            ? { duration: 0.45 + intensity * 0.25, repeat: Infinity, delay: i * 0.055, ease: "easeInOut" }
            : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Countdown timer ring                                         */
/* ─────────────────────────────────────────────────────────── */
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setRemaining(seconds);
    ref.current = setInterval(() => {
      setRemaining(prev => { if (prev <= 1) { clearInterval(ref.current!); onExpire(); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [seconds, onExpire]);
  const pct = remaining / seconds;
  const r = 16, circ = 2 * Math.PI * r;
  const color = remaining < 15 ? "stroke-rose-400 text-rose-400" : remaining < 30 ? "stroke-amber-400 text-amber-400" : "stroke-emerald-400 text-emerald-400";
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-10 h-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={r} fill="none" strokeWidth="2.5" className="stroke-white/10" />
          <circle cx="20" cy="20" r={r} fill="none" strokeWidth="2.5" className={color.split(" ")[0]} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", color.split(" ")[1])}>
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Verdict overlay                                              */
/* ─────────────────────────────────────────────────────────── */
function VerdictOverlay({ score, onContinue }: { score: number; onContinue: () => void }) {
  const verdict = score >= 7.5 ? "hired" : score >= 5.5 ? "borderline" : "not_hired";
  const cfg = {
    hired: { Icon: Trophy, headline: "You're Hired!", sub: "Outstanding — you impressed across the board.", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-400/5", border: "border-emerald-400/30", glow: "shadow-[0_0_80px_rgba(52,211,153,0.25)]", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", label: "Offer Extended" },
    borderline: { Icon: Star, headline: "Strong Candidate", sub: "Good showing — a bit more polish and you'd be a top pick.", color: "text-amber-400", bg: "from-amber-500/20 to-amber-400/5", border: "border-amber-400/30", glow: "shadow-[0_0_80px_rgba(251,191,36,0.2)]", badge: "bg-amber-400/10 text-amber-300 border-amber-400/20", label: "Awaiting Decision" },
    not_hired: { Icon: XCircle, headline: "Not Selected", sub: "Don't give up — review your feedback and keep practicing.", color: "text-rose-400", bg: "from-rose-500/20 to-rose-400/5", border: "border-rose-400/30", glow: "shadow-[0_0_80px_rgba(251,113,133,0.2)]", badge: "bg-rose-400/10 text-rose-300 border-rose-400/20", label: "Application Declined" },
  }[verdict];
  const { Icon } = cfg;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl px-4">
      <motion.div initial={{ scale: 0.8, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.1 }}
        className={cn("w-full max-w-md rounded-3xl border p-10 text-center bg-gradient-to-b", cfg.bg, cfg.border, cfg.glow)}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.3 }}
          className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border", cfg.badge)}>
          <Icon className={cn("w-12 h-12", cfg.color)} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <span className={cn("text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-4 inline-block", cfg.badge)}>{cfg.label}</span>
          <h2 className={cn("text-4xl font-display font-bold mt-3 mb-3", cfg.color)}>{cfg.headline}</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{cfg.sub}</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-muted-foreground text-sm">Overall Score</span>
            <span className={cn("text-3xl font-display font-bold", cfg.color)}>{score.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">/ 10</span>
          </div>
          <button onClick={onContinue} className="w-full py-4 rounded-xl font-semibold bg-white/10 border border-white/10 text-foreground hover:bg-white/15 transition-all">
            View Detailed Review →
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tone badge colours                                           */
/* ─────────────────────────────────────────────────────────── */
const TONE_COLORS: Record<string, string> = {
  confident: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  enthusiastic: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  composed: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  nervous: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  uncertain: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  monotone: "bg-gray-400/10 text-gray-400 border-gray-400/20",
};

/* ─────────────────────────────────────────────────────────── */
/* Main component                                               */
/* ─────────────────────────────────────────────────────────── */
export function ActiveSession() {
  const [, params] = useRoute("/session/:id");
  const sessionId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { speak, stop, isSpeaking } = useTTS();
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  const say = useCallback((text: string, onEnd?: () => void) => {
    if (isMutedRef.current) { onEnd?.(); return; }
    speak(text, { onEnd });
  }, [speak]);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  /* Queries & mutations */
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.sessions.get(sessionId),
    enabled: sessionId > 0,
  });
  const { data: defaultQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.questions.list(),
    enabled: !!session && !session.resumeText && !session.company,
  });
  const generateMutation = useMutation({ mutationFn: api.generateQuestions });
  const analyzeMutation = useMutation({ mutationFn: api.analyze });
  const saveAnswerMutation = useMutation({ mutationFn: api.answers.save });
  const endSessionMutation = useMutation({
    mutationFn: (id: number) => api.sessions.end(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });
  const { isRecording, transcript, isSupported: voiceSupported, toggleRecording, setTranscript } = useVoiceRecording();

  /* State */
  const [phase, setPhase] = useState<Phase>("loading");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswer, setLocalAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnalysisResult | null>(null);
  const [verdictData, setVerdictData] = useState<{ score: number } | null>(null);
  const [localScores, setLocalScores] = useState<number[]>([]);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const introFiredRef = useRef(false);

  /* Build question list */
  const questions: GeneratedQuestion[] =
    (generatedQuestions?.length ? generatedQuestions : null) ??
    (defaultQuestions?.map(q => ({ text: q.text, category: q.category, difficulty: q.difficulty as "easy" | "medium" | "hard", followUps: q.followUps })) ?? []);

  /* Persona helpers */
  const personaKey = (session?.persona ?? "friendly") as keyof typeof PERSONAS;
  const persona = PERSONAS[personaKey] ?? PERSONAS.friendly;

  /* ── Generate questions once on session load ── */
  useEffect(() => {
    if (!session || generatedQuestions !== null || generateMutation.isPending) return;
    const needsAI = session.resumeText || session.company || session.persona !== "friendly";
    if (!needsAI) return;
    generateMutation.mutateAsync({
      role: session.role, company: session.company, persona: session.persona as "friendly" | "tough" | "technical",
      resumeText: session.resumeText, drillCategory: null, count: 12,
    }).then(res => setGeneratedQuestions(res.questions)).catch(() => {
      toast({ title: "Using default questions", variant: "destructive" });
      setGeneratedQuestions([]);
    });
  }, [session]);

  /* ── Kick off intro sequence once questions are ready ── */
  useEffect(() => {
    if (introFiredRef.current) return;
    if (sessionLoading) return;
    if (!session) return;
    const needsAI = session.resumeText || session.company || session.persona !== "friendly";
    if (needsAI && generatedQuestions === null) return; // still generating
    if (questions.length === 0) return;

    introFiredRef.current = true;
    setPhase("intro");

    const introText = persona.intro(session.role, session.company ?? null);
    const firstQ = questions[0]?.text ?? "";

    say(introText, () => {
      setPhase("question");
      say(firstQ);
    });
  }, [session, sessionLoading, generatedQuestions, questions.length]);

  /* ── Voice transcript → textarea ── */
  useEffect(() => {
    if (!transcript) return;
    setLocalAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
    setTranscript("");
    if (phase === "question") setPhase("answering");
  }, [transcript]);

  /* ── Stop TTS when user starts recording ── */
  useEffect(() => { if (isRecording) stop(); }, [isRecording]);

  const currentQuestion = questions[currentQuestionIndex % Math.max(1, questions.length)];

  /* ── Handle timer expire ── */
  const handleTimerExpire = useCallback(() => {
    if (localAnswer.trim()) {
      toast({ title: "Time's up! Auto-submitting…", variant: "destructive" });
      handleSubmit();
    } else {
      toast({ title: "Time's up!", description: "Try to answer faster next time.", variant: "destructive" });
    }
  }, [localAnswer]);

  /* ── Submit answer ── */
  async function handleSubmit() {
    if (!localAnswer.trim()) { toast({ title: "Please provide an answer.", variant: "destructive" }); return; }
    if (isRecording) toggleRecording();
    stop();
    setPhase("analyzing");
    say("Let me take a moment to review your answer.");
    try {
      const result = await analyzeMutation.mutateAsync({
        questionText: currentQuestion.text, answerText: localAnswer,
        role: session!.role, sessionId: session!.id, company: session!.company,
        persona: session!.persona, resumeText: session!.resumeText,
      });
      await saveAnswerMutation.mutateAsync({ sessionId: session!.id, questionText: currentQuestion.text, answerText: localAnswer, analysisResult: result });
      setLocalScores(prev => [...prev, result.overallScore]);
      setFeedback(result);
      setShowSideBySide(false);
      refetchSession();
      setPhase("feedback");
      const reviewText = persona.reviewLine(result.overallScore, result.feedback.split(".")[0] + ".");
      say(reviewText);
    } catch {
      toast({ title: "Analysis failed.", variant: "destructive" });
      setPhase("answering");
    }
  }

  /* ── Next question ── */
  function handleNext() {
    stop();
    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);
    setLocalAnswer("");
    setFeedback(null);
    setTimerKey(k => k + 1);
    setPhase("question");
    const transition = persona.nextLine(nextIdx + 1);
    const nextQ = questions[nextIdx % Math.max(1, questions.length)]?.text ?? "";
    say(transition, () => say(nextQ));
  }

  /* ── End session ── */
  async function handleEndSession() {
    const allScores = [...localScores, ...(session?.answers ?? []).map(a => a.overallScore ?? 0).filter(s => s > 0)];
    if (allScores.length === 0) { toast({ title: "Answer at least one question first.", variant: "destructive" }); return; }
    stop();
    setPhase("ending");
    say("That concludes our session. Let me compute your final result.");
    try {
      await endSessionMutation.mutateAsync(session!.id);
      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      setVerdictData({ score: avg });
    } catch { toast({ title: "Failed to end session.", variant: "destructive" }); setPhase("feedback"); }
  }

  /* ── Loading ── */
  const isGenerating = generateMutation.isPending;
  if (sessionLoading || (isGenerating && questions.length === 0)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-5">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{isGenerating ? "Preparing your personalized interview…" : "Loading session…"}</p>
          {isGenerating && <p className="text-sm text-muted-foreground mt-1">Tailoring questions to your resume & background</p>}
        </div>
      </div>
    );
  }

  if (!session) return <div className="text-center mt-20 text-muted-foreground">Session not found.</div>;

  const answeredCount = (session.answers?.length ?? 0) + localScores.length;

  return (
    <>
      {verdictData && <VerdictOverlay score={verdictData.score} onContinue={() => { window.location.href = `/session/${session.id}/review`; }} />}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", persona.dot)} />
            <span className="text-xs text-muted-foreground font-medium">Live Interview</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-muted-foreground">{session.role}{session.company ? ` · ${session.company}` : ""}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Q{currentQuestionIndex + 1}{questions.length ? ` / ${questions.length}` : ""}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{answeredCount} answered</span>
          {session.timedMode && phase === "question" || phase === "answering" ? (
            <CountdownTimer key={timerKey} seconds={session.timePerQuestion} onExpire={handleTimerExpire} />
          ) : null}
          <button onClick={() => { setIsMuted(m => !m); if (!isMuted) stop(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground transition-colors text-xs">
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isMuted ? "Muted" : "Audio on"}
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-9rem)]">

        {/* ══ Left: Interviewer "Video" Panel ══ */}
        <div className="lg:w-[45%] flex flex-col gap-3">
          <div className={cn(
            "relative flex-1 rounded-3xl overflow-hidden border border-white/5",
            "bg-gradient-to-br from-[#0d0d14] via-[#0f1020] to-[#080810]"
          )}>
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

            {/* Recording indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", persona.dot)} />
                <span className="text-xs font-medium text-white/80">REC</span>
              </div>
            </div>

            {/* Mute indicator */}
            {isMuted && (
              <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm">
                <VolumeX className="w-3.5 h-3.5 text-white/60" />
              </div>
            )}

            {/* Center content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-8 gap-6">

              {/* Avatar */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulse rings when speaking */}
                <AnimatePresence>
                  {isSpeaking && (
                    <>
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="absolute w-40 h-40 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "2s" }} />
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="absolute w-52 h-52 rounded-full border border-white/[0.03] animate-ping" style={{ animationDuration: "2.8s", animationDelay: "0.4s" }} />
                    </>
                  )}
                </AnimatePresence>

                {/* Avatar circle */}
                <div className={cn(
                  "relative w-32 h-32 rounded-full flex items-center justify-center",
                  "ring-4 ring-offset-4 ring-offset-[#0d0d14] transition-all duration-500",
                  isSpeaking ? persona.ring : "ring-white/5",
                  "bg-gradient-to-br",
                  persona.color
                )}>
                  <span className="text-5xl font-display font-bold text-white/90 select-none">
                    {persona.name[0]}
                  </span>
                </div>
              </div>

              {/* Name & title */}
              <div className="text-center">
                <h3 className="text-xl font-display font-bold text-white">{persona.name}</h3>
                <p className="text-xs text-white/40 mt-0.5">{persona.title}</p>
              </div>

              {/* Speaking waveform */}
              <div className="flex flex-col items-center gap-2">
                <SpeakingWave active={isSpeaking} colorClass={persona.wave} />
                <span className={cn("text-xs font-medium transition-colors", isSpeaking ? "text-white/60" : "text-white/20")}>
                  {isSpeaking ? "Speaking…" : phase === "analyzing" ? "Reviewing…" : "Listening"}
                </span>
              </div>

              {/* Question display */}
              <AnimatePresence mode="wait">
                {(phase === "question" || phase === "answering" || phase === "feedback" || phase === "analyzing") && currentQuestion && (
                  <motion.div key={`q-${currentQuestionIndex}`}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="w-full text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-medium", persona.badge)}>
                        Q{currentQuestionIndex + 1}
                      </span>
                      <span className={cn("text-xs capitalize font-medium",
                        currentQuestion.difficulty === "hard" ? "text-rose-400" :
                        currentQuestion.difficulty === "medium" ? "text-amber-400" : "text-emerald-400"
                      )}>
                        <Flag className="w-3 h-3 inline mr-0.5" />{currentQuestion.difficulty}
                      </span>
                    </div>
                    <p className="text-base sm:text-lg font-medium text-white/85 leading-relaxed">
                      "{currentQuestion.text}"
                    </p>
                  </motion.div>
                )}
                {phase === "intro" && (
                  <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center">
                    <p className="text-white/40 text-sm animate-pulse">{persona.name} is introducing themselves…</p>
                  </motion.div>
                )}
                {phase === "loading" && (
                  <motion.div key="loading-q" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom bar: category */}
            {currentQuestion && phase !== "intro" && (
              <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
                <span className="text-xs text-white/30 capitalize">{currentQuestion.category?.replace("-", " ")}</span>
                <button onClick={handleEndSession} disabled={endSessionMutation.isPending}
                  className="text-xs text-white/30 hover:text-rose-400 transition-colors">
                  End session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ Right: Response / Feedback Panel ══ */}
        <div className="lg:w-[55%] flex flex-col h-full">
          <AnimatePresence mode="wait">

            {/* ── Your turn — text input ── */}
            {(phase === "question" || phase === "answering") && (
              <motion.div key="input-panel"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden">

                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full", isRecording ? "bg-rose-500 animate-pulse" : "bg-white/20")} />
                    <span className="font-semibold text-sm">{isRecording ? "Listening to you…" : "Your Response"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{localAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>

                {/* Recording visual */}
                {isRecording && (
                  <div className="px-6 py-3 bg-rose-500/5 border-b border-rose-500/10 flex items-center gap-3">
                    <SpeakingWave active colorClass="bg-rose-400" />
                    <span className="text-xs text-rose-400 font-medium">Speak clearly — we're transcribing in real time</span>
                  </div>
                )}

                <textarea value={localAnswer} onChange={e => { setLocalAnswer(e.target.value); if (phase === "question" && e.target.value) setPhase("answering"); }}
                  placeholder={`Speak your answer or type here… ${persona.name} is waiting.`}
                  className="flex-1 w-full bg-transparent resize-none focus:ring-0 border-none outline-none p-6 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40" />

                <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 bg-black/10">
                  <div className="flex items-center gap-3">
                    {voiceSupported ? (
                      <button onClick={toggleRecording}
                        className={cn(
                          "flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg",
                          isRecording
                            ? "bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600 scale-105"
                            : "bg-white/5 border border-border text-foreground hover:bg-white/10"
                        )}>
                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Voice not supported in this browser.</span>
                    )}
                    {!isRecording && <span className="text-xs text-muted-foreground">or type your answer above</span>}
                  </div>
                  <button onClick={handleSubmit} disabled={!localAnswer.trim()}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200">
                    Submit <Send className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Analyzing ── */}
            {phase === "analyzing" && (
              <motion.div key="analyzing-panel"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 glass-panel rounded-3xl flex flex-col items-center justify-center text-center gap-5 p-12">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-1">{persona.name} is reviewing your answer</h3>
                  <p className="text-sm text-muted-foreground">Evaluating clarity, STAR structure, tone, confidence…</p>
                </div>
                <div className="flex items-center gap-2">
                  <SpeakingWave active={isSpeaking} colorClass="bg-primary" />
                </div>
              </motion.div>
            )}

            {/* ── Feedback ── */}
            {phase === "feedback" && feedback && (
              <motion.div key="feedback-panel"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden">

                {/* Feedback header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{persona.name}'s Feedback</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {feedback.toneAnalysis && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize font-medium", TONE_COLORS[feedback.toneAnalysis.toLowerCase()] ?? "bg-secondary text-muted-foreground border-border")}>
                            <Volume2 className="w-3 h-3 inline mr-1" />{feedback.toneAnalysis}
                          </span>
                        )}
                        {feedback.fillerWordCount > 0 && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", feedback.fillerWordCount > 5 ? "bg-rose-400/10 text-rose-400 border-rose-400/20" : "bg-amber-400/10 text-amber-400 border-amber-400/20")}>
                            {feedback.fillerWordCount} filler{feedback.fillerWordCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowSideBySide(s => !s)}
                      className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                        showSideBySide ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground")}>
                      {showSideBySide ? <AlignLeft className="w-3.5 h-3.5" /> : <Columns2 className="w-3.5 h-3.5" />}
                      {showSideBySide ? "Single" : "Compare"}
                    </button>
                    <div className={cn("px-3 py-1.5 rounded-xl font-bold text-lg border", getScoreColor(feedback.overallScore), "border-white/10 bg-white/5")}>
                      {feedback.overallScore.toFixed(1)}<span className="text-xs opacity-50 ml-0.5">/10</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                  {/* Scores */}
                  <div className="grid grid-cols-4 gap-3">
                    <ScoreGauge score={feedback.clarityScore} label="Clarity" size="sm" />
                    <ScoreGauge score={feedback.confidenceScore} label="Confidence" size="sm" />
                    <ScoreGauge score={feedback.technicalDepthScore} label="Tech" size="sm" />
                    <ScoreGauge score={feedback.communicationScore} label="Comm." size="sm" />
                  </div>

                  {/* STAR */}
                  {feedback.starScore != null && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-400/5 border border-violet-400/20">
                      <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-violet-400">STAR Structure</span>
                          <span className="text-xs font-bold text-violet-400">{feedback.starScore.toFixed(1)}/10</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(feedback.starScore / 10) * 100}%` }} />
                        </div>
                        {feedback.starFeedback && <p className="text-xs text-muted-foreground mt-1">{feedback.starFeedback}</p>}
                      </div>
                    </div>
                  )}

                  {/* Side by side OR standard */}
                  {showSideBySide ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Answer</p>
                        <div className="text-sm bg-secondary/30 border border-border p-3 rounded-xl leading-relaxed h-36 overflow-y-auto text-foreground/80">{localAnswer}</div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" />Improved</p>
                        <div className="text-sm bg-primary/5 border border-primary/20 p-3 rounded-xl leading-relaxed h-36 overflow-y-auto italic text-primary-foreground/80">{feedback.improvedAnswer}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Strengths</p>
                          <ul className="space-y-1.5">
                            {feedback.strengths?.map((s, i) => <li key={i} className="text-sm bg-emerald-400/5 border border-emerald-400/10 px-3 py-2.5 rounded-lg text-emerald-100/80 leading-relaxed">{s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />Improve</p>
                          <ul className="space-y-1.5">
                            {feedback.weaknesses?.map((w, i) => <li key={i} className="text-sm bg-rose-400/5 border border-rose-400/10 px-3 py-2.5 rounded-lg text-rose-100/80 leading-relaxed">{w}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                        <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" />Improved Answer</p>
                        <p className="text-sm italic text-primary-foreground/80 leading-relaxed border-l-2 border-primary/50 pl-3">{feedback.improvedAnswer}</p>
                      </div>
                    </>
                  )}

                  {/* Follow-ups */}
                  {feedback.followUpQuestions?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Follow-up Questions</p>
                      <div className="space-y-1.5">
                        {feedback.followUpQuestions.map((q, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-white/3 px-4 py-2.5 rounded-xl border border-white/5">
                            <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50 shrink-0" />{q}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 border-t border-border bg-black/20 flex items-center justify-between">
                  <button onClick={handleEndSession} disabled={endSessionMutation.isPending}
                    className="text-sm text-muted-foreground hover:text-rose-400 transition-colors">
                    End & get verdict
                  </button>
                  <button onClick={handleNext}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-white text-black hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-200">
                    Next Question <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Intro / Ending loading state ── */}
            {(phase === "intro" || phase === "ending") && (
              <motion.div key="intro-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 glass-panel rounded-3xl flex flex-col items-center justify-center gap-4 text-center p-12">
                <div className="flex items-center gap-1.5">
                  <SpeakingWave active={isSpeaking} colorClass="bg-primary" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {phase === "intro" ? `${persona.name} is introducing the session…` : "Computing your final verdict…"}
                </p>
                <p className="text-xs text-muted-foreground/50">Make sure your volume is turned up.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
