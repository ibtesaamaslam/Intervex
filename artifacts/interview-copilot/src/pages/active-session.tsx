import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AnalysisResult, type GeneratedQuestion } from "@/lib/api";
import { useVoiceRecording } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { cn, getScoreBg, getScoreColor } from "@/lib/utils";
import {
  Mic, Square, Send, Loader2, AlertCircle, CheckCircle2,
  Lightbulb, ArrowRight, Flag, Target, Sparkles, BrainCircuit,
  Trophy, XCircle, Star, Clock, Columns2, AlignLeft, Volume2, BookOpen
} from "lucide-react";

/* ---------- Verdict Overlay ---------- */
type Verdict = "hired" | "not_hired" | "borderline";
function getVerdict(score: number): Verdict {
  if (score >= 7.5) return "hired";
  if (score >= 5.5) return "borderline";
  return "not_hired";
}
function VerdictOverlay({ score, onContinue }: { score: number; onContinue: () => void }) {
  const verdict = getVerdict(score);
  const config = {
    hired: { icon: Trophy, headline: "You're Hired!", sub: "Outstanding performance — you impressed across the board.", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-400/5", border: "border-emerald-400/30", glow: "shadow-[0_0_80px_rgba(52,211,153,0.25)]", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", label: "Offer Extended" },
    borderline: { icon: Star, headline: "Strong Candidate", sub: "Good showing — with a bit more polish you'd be a top pick.", color: "text-amber-400", bg: "from-amber-500/20 to-amber-400/5", border: "border-amber-400/30", glow: "shadow-[0_0_80px_rgba(251,191,36,0.2)]", badge: "bg-amber-400/10 text-amber-300 border-amber-400/20", label: "Awaiting Decision" },
    not_hired: { icon: XCircle, headline: "Not Selected", sub: "Don't give up — review your feedback and keep practicing.", color: "text-rose-400", bg: "from-rose-500/20 to-rose-400/5", border: "border-rose-400/30", glow: "shadow-[0_0_80px_rgba(251,113,133,0.2)]", badge: "bg-rose-400/10 text-rose-300 border-rose-400/20", label: "Application Declined" },
  }[verdict];
  const Icon = config.icon;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <motion.div initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
        className={cn("w-full max-w-md rounded-3xl border p-10 text-center bg-gradient-to-b", config.bg, config.border, config.glow)}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 }}
          className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border", config.badge)}>
          <Icon className={cn("w-12 h-12", config.color)} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <span className={cn("text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-4 inline-block", config.badge)}>{config.label}</span>
          <h2 className={cn("text-4xl font-display font-bold mt-3 mb-3", config.color)}>{config.headline}</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{config.sub}</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-muted-foreground text-sm">Overall Score</span>
            <span className={cn("text-3xl font-display font-bold", config.color)}>{score.toFixed(1)}</span>
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

/* ---------- Countdown Timer ---------- */
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setRemaining(seconds);
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current!); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [seconds, onExpire]);
  const pct = remaining / seconds;
  const color = remaining < 15 ? "text-rose-400" : remaining < 30 ? "text-amber-400" : "text-emerald-400";
  const ring = remaining < 15 ? "stroke-rose-400" : remaining < 30 ? "stroke-amber-400" : "stroke-emerald-400";
  const r = 20, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={r} fill="none" strokeWidth="3" className="stroke-border" />
          <circle cx="24" cy="24" r={r} fill="none" strokeWidth="3" className={ring} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums", color)}>
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">Time Left</span>
        <span className={cn("text-xs font-bold", color)}>{remaining < 15 ? "Hurry up!" : remaining < 30 ? "Wrapping up..." : "On track"}</span>
      </div>
    </div>
  );
}

/* ---------- Tone Badge ---------- */
const TONE_COLORS: Record<string, string> = {
  confident: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  enthusiastic: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  composed: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  nervous: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  uncertain: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  monotone: "bg-gray-400/10 text-gray-400 border-gray-400/20",
};

/* ---------- Main Page ---------- */
export function ActiveSession() {
  const [, params] = useRoute("/session/:id");
  const sessionId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.sessions.get(sessionId),
    enabled: sessionId > 0,
  });

  const { data: defaultQuestions, isLoading: questionsLoading } = useQuery({
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

  const { isRecording, transcript, isSupported, toggleRecording, setTranscript } = useVoiceRecording();

  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswer, setLocalAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnalysisResult | null>(null);
  const [verdictData, setVerdictData] = useState<{ score: number; sessionId: number } | null>(null);
  const [localScores, setLocalScores] = useState<number[]>([]);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  // Generate AI questions once when session loads and has resume/company
  useEffect(() => {
    if (!session) return;
    if (generatedQuestions !== null || generatingQuestions) return;
    if (!session.resumeText && !session.company && session.persona === "friendly") return;
    setGeneratingQuestions(true);
    generateMutation.mutateAsync({
      role: session.role,
      company: session.company,
      persona: session.persona as "friendly" | "tough" | "technical",
      resumeText: session.resumeText,
      drillCategory: null,
      count: 12,
    }).then(res => {
      setGeneratedQuestions(res.questions);
    }).catch(() => {
      toast({ title: "Using default questions", description: "Could not generate personalized questions.", variant: "destructive" });
      setGeneratedQuestions([]);
    }).finally(() => setGeneratingQuestions(false));
  }, [session]);

  useEffect(() => {
    if (transcript) {
      setLocalAnswer(prev => prev ? prev + " " + transcript : transcript);
      setTranscript("");
    }
  }, [transcript, setTranscript]);

  const handleTimerExpire = useCallback(() => {
    if (localAnswer.trim()) {
      toast({ title: "Time's up!", description: "Your answer has been auto-submitted.", variant: "destructive" });
      handleSubmit();
    } else {
      toast({ title: "Time's up!", description: "Please start answering faster next time.", variant: "destructive" });
    }
  }, [localAnswer]);

  const questions = generatedQuestions?.length
    ? generatedQuestions
    : defaultQuestions?.map(q => ({ text: q.text, category: q.category, difficulty: q.difficulty as "easy" | "medium" | "hard", followUps: q.followUps })) ?? [];

  const isLoadingQuestions = sessionLoading || questionsLoading || generatingQuestions;

  if (isLoadingQuestions) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        {generatingQuestions && (
          <div className="text-center">
            <p className="text-muted-foreground font-medium">Generating personalized questions...</p>
            <p className="text-xs text-muted-foreground mt-1">Tailoring to your {session?.company ? `${session.company} interview` : "background"}</p>
          </div>
        )}
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return <div className="text-center mt-20 text-muted-foreground">Session or questions not found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex % questions.length];

  async function handleSubmit() {
    if (!localAnswer.trim()) {
      toast({ title: "Empty Answer", description: "Please provide an answer.", variant: "destructive" });
      return;
    }
    if (isRecording) toggleRecording();
    try {
      const analysisResult = await analyzeMutation.mutateAsync({
        questionText: currentQuestion.text,
        answerText: localAnswer,
        role: session!.role,
        sessionId: session!.id,
        company: session!.company,
        persona: session!.persona,
        resumeText: session!.resumeText,
      });
      await saveAnswerMutation.mutateAsync({
        sessionId: session!.id,
        questionText: currentQuestion.text,
        answerText: localAnswer,
        analysisResult,
      });
      setLocalScores(prev => [...prev, analysisResult.overallScore]);
      setFeedback(analysisResult);
      setShowSideBySide(false);
      refetchSession();
    } catch {
      toast({ title: "Analysis Failed", description: "Something went wrong.", variant: "destructive" });
    }
  }

  const handleNext = () => {
    setFeedback(null);
    setLocalAnswer("");
    setCurrentQuestionIndex(prev => prev + 1);
    setTimerKey(k => k + 1);
  };

  const handleEndSession = async () => {
    if (localScores.length === 0 && (session.answers?.length ?? 0) === 0) {
      toast({ title: "No answers yet", description: "Answer at least one question before ending.", variant: "destructive" });
      return;
    }
    try {
      await endSessionMutation.mutateAsync(session.id);
      const allScores = [
        ...localScores,
        ...(session.answers ?? []).map(a => a.overallScore != null ? Number(a.overallScore) : null).filter(Boolean) as number[],
      ];
      const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 5;
      setVerdictData({ score: avgScore, sessionId: session.id });
    } catch {
      toast({ title: "Error", description: "Failed to end session.", variant: "destructive" });
    }
  };

  const isAnalyzing = analyzeMutation.isPending || saveAnswerMutation.isPending;
  const answeredCount = (session.answers?.length ?? 0) + localScores.length;

  return (
    <>
      {verdictData && <VerdictOverlay score={verdictData.score} onContinue={() => { window.location.href = `/session/${verdictData.sessionId}/review`; }} />}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
        {/* Left: Question Panel */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                Q{currentQuestionIndex + 1}
              </span>
              <div className="flex items-center gap-2">
                {session.persona !== "friendly" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary border border-border text-muted-foreground capitalize">
                    {session.persona}
                  </span>
                )}
                {generatedQuestions?.length ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">AI</span>
                ) : null}
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-bold leading-relaxed text-foreground flex-1">
              "{currentQuestion.text}"
            </h2>

            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" /> <span className="capitalize">{currentQuestion.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flag className="w-4 h-4" />
                <span className={cn("capitalize font-medium",
                  currentQuestion.difficulty === "hard" ? "text-rose-400" :
                  currentQuestion.difficulty === "medium" ? "text-amber-400" : "text-emerald-400"
                )}>{currentQuestion.difficulty}</span>
              </div>
              {answeredCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{answeredCount} answered</span>
                </div>
              )}
              {session.targetDate && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Clock className="w-3 h-3" />
                  {Math.max(0, Math.ceil((new Date(session.targetDate).getTime() - Date.now()) / 86400000))} days to interview
                </div>
              )}
            </div>
          </div>

          <button onClick={handleEndSession} disabled={endSessionMutation.isPending}
            className="px-6 py-3.5 rounded-2xl border border-destructive/20 text-destructive font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50 text-sm">
            {endSessionMutation.isPending ? "Ending..." : "End Session & Get Verdict"}
          </button>
        </div>

        {/* Right: Answer / Analysis Panel */}
        <div className="lg:w-2/3 flex flex-col h-full relative">
          <AnimatePresence mode="wait">
            {!feedback && !isAnalyzing ? (
              <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 rounded-3xl flex-1 flex flex-col relative overflow-hidden">
                {isRecording && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-400 animate-pulse" />}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg">Your Response</h3>
                  <div className="flex items-center gap-3">
                    {session.timedMode && !feedback && (
                      <CountdownTimer key={timerKey} seconds={session.timePerQuestion} onExpire={handleTimerExpire} />
                    )}
                    {isRecording && (
                      <span className="flex items-center gap-2 text-rose-400 text-sm font-medium bg-rose-400/10 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Listening...
                      </span>
                    )}
                  </div>
                </div>

                <textarea value={localAnswer} onChange={e => setLocalAnswer(e.target.value)}
                  placeholder="Type your answer here, or click the microphone to speak..."
                  className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/50 p-0 outline-none" />

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isSupported ? (
                      <button onClick={toggleRecording}
                        className={cn("flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg",
                          isRecording ? "bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-600 hover:scale-105" : "bg-white/5 text-foreground hover:bg-white/10 hover:scale-105")}>
                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Voice not supported.</span>
                    )}
                    {isRecording && <span className="text-sm text-muted-foreground animate-pulse">Speak clearly...</span>}
                  </div>
                  <button onClick={handleSubmit} disabled={!localAnswer.trim()}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    Submit <Send className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

            ) : isAnalyzing ? (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel p-12 rounded-3xl flex-1 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Analyzing your response...</h3>
                <p className="text-muted-foreground max-w-sm">Evaluating clarity, STAR structure, tone, and more...</p>
              </motion.div>

            ) : feedback ? (
              <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-border bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold">Analysis Complete</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Tone badge */}
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize font-medium", TONE_COLORS[feedback.toneAnalysis?.toLowerCase()] ?? "bg-secondary text-muted-foreground border-border")}>
                          <Volume2 className="w-3 h-3 inline mr-1" />{feedback.toneAnalysis}
                        </span>
                        {/* Filler word badge */}
                        {feedback.fillerWordCount > 0 && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
                            feedback.fillerWordCount > 5 ? "bg-rose-400/10 text-rose-400 border-rose-400/20" : "bg-amber-400/10 text-amber-400 border-amber-400/20")}>
                            {feedback.fillerWordCount} filler word{feedback.fillerWordCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowSideBySide(s => !s)}
                      className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                        showSideBySide ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground")}>
                      {showSideBySide ? <AlignLeft className="w-3.5 h-3.5" /> : <Columns2 className="w-3.5 h-3.5" />}
                      {showSideBySide ? "Single" : "Compare"}
                    </button>
                    <div className={cn("px-4 py-2 rounded-xl font-bold text-xl border", getScoreBg(feedback.overallScore), getScoreColor(feedback.overallScore))}>
                      {feedback.overallScore.toFixed(1)} <span className="text-sm opacity-50">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                  {/* Score gauges */}
                  <div className="grid grid-cols-4 gap-3">
                    <ScoreGauge score={feedback.clarityScore} label="Clarity" size="sm" />
                    <ScoreGauge score={feedback.confidenceScore} label="Confidence" size="sm" />
                    <ScoreGauge score={feedback.technicalDepthScore} label="Tech Depth" size="sm" />
                    <ScoreGauge score={feedback.communicationScore} label="Comm." size="sm" />
                  </div>

                  {/* STAR score */}
                  {feedback.starScore != null && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-400/5 border border-violet-400/20">
                      <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-violet-400">STAR Structure</span>
                          <span className="text-sm font-bold text-violet-400">{feedback.starScore.toFixed(1)}/10</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${(feedback.starScore / 10) * 100}%` }} />
                        </div>
                        {feedback.starFeedback && <p className="text-xs text-muted-foreground mt-1">{feedback.starFeedback}</p>}
                      </div>
                    </div>
                  )}

                  {/* Side-by-side OR standard view */}
                  {showSideBySide ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Answer</div>
                        <div className="text-sm text-foreground/80 bg-secondary/30 p-4 rounded-xl border border-border leading-relaxed h-40 overflow-y-auto">
                          {localAnswer}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Improved</div>
                        <div className="text-sm text-primary-foreground/80 bg-primary/5 p-4 rounded-xl border border-primary/20 leading-relaxed h-40 overflow-y-auto italic">
                          {feedback.improvedAnswer}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="flex items-center gap-2 font-bold text-emerald-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Strengths</h4>
                          <ul className="space-y-1.5">
                            {feedback.strengths?.map((s, i) => (
                              <li key={i} className="text-sm bg-emerald-400/5 border border-emerald-400/10 p-3 rounded-lg text-emerald-100/80 leading-relaxed">{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="flex items-center gap-2 font-bold text-rose-400 text-sm"><AlertCircle className="w-4 h-4" /> Improve</h4>
                          <ul className="space-y-1.5">
                            {feedback.weaknesses?.map((w, i) => (
                              <li key={i} className="text-sm bg-rose-400/5 border border-rose-400/10 p-3 rounded-lg text-rose-100/80 leading-relaxed">{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                        <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-sm"><Lightbulb className="w-4 h-4" /> Improved Answer</h4>
                        <p className="text-sm text-primary-foreground/80 leading-relaxed italic border-l-2 border-primary/50 pl-3">{feedback.improvedAnswer}</p>
                      </div>

                      {feedback.followUpQuestions?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Follow-up Questions</h4>
                          <div className="flex flex-col gap-1.5">
                            {feedback.followUpQuestions.map((q, i) => (
                              <div key={i} className="text-sm text-muted-foreground bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">{q}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="p-5 border-t border-border bg-black/20 flex justify-between items-center">
                  <button onClick={handleEndSession} disabled={endSessionMutation.isPending}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                    End & Get Verdict
                  </button>
                  <button onClick={handleNext}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-white text-black hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-300">
                    Next Question <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
