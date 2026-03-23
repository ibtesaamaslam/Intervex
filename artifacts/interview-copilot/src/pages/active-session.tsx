import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AnalysisResult } from "@/lib/api";
import { useVoiceRecording } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { 
  Mic, Square, Send, Loader2, AlertCircle, CheckCircle2, 
  Lightbulb, ArrowRight, Flag, Target, Sparkles, BrainCircuit,
  Trophy, XCircle, Star
} from "lucide-react";
import { cn, getScoreBg, getScoreColor } from "@/lib/utils";

type Verdict = "hired" | "not_hired" | "borderline";

function getVerdict(score: number): Verdict {
  if (score >= 7.5) return "hired";
  if (score >= 5.5) return "borderline";
  return "not_hired";
}

function VerdictOverlay({ score, onContinue }: { score: number; onContinue: () => void }) {
  const verdict = getVerdict(score);

  const config = {
    hired: {
      icon: Trophy,
      headline: "You're Hired!",
      sub: "Outstanding performance. You impressed us across the board.",
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-400/5",
      border: "border-emerald-400/30",
      glow: "shadow-[0_0_80px_rgba(52,211,153,0.25)]",
      badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      label: "Offer Extended",
    },
    borderline: {
      icon: Star,
      headline: "Strong Candidate",
      sub: "Good showing — with a bit more polish you'd be a top pick.",
      color: "text-amber-400",
      bg: "from-amber-500/20 to-amber-400/5",
      border: "border-amber-400/30",
      glow: "shadow-[0_0_80px_rgba(251,191,36,0.2)]",
      badge: "bg-amber-400/10 text-amber-300 border-amber-400/20",
      label: "Awaiting Decision",
    },
    not_hired: {
      icon: XCircle,
      headline: "Not Selected",
      sub: "Don't give up — practice makes perfect. Review your feedback and try again.",
      color: "text-rose-400",
      bg: "from-rose-500/20 to-rose-400/5",
      border: "border-rose-400/30",
      glow: "shadow-[0_0_80px_rgba(251,113,133,0.2)]",
      badge: "bg-rose-400/10 text-rose-300 border-rose-400/20",
      label: "Application Declined",
    },
  }[verdict];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
        className={cn(
          "w-full max-w-md rounded-3xl border p-10 text-center bg-gradient-to-b",
          config.bg,
          config.border,
          config.glow
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 }}
          className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border", config.badge)}
        >
          <Icon className={cn("w-12 h-12", config.color)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <span className={cn("text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-4 inline-block", config.badge)}>
            {config.label}
          </span>
          <h2 className={cn("text-4xl font-display font-bold mt-3 mb-3", config.color)}>
            {config.headline}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 text-base">
            {config.sub}
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-muted-foreground text-sm">Overall Score</span>
            <span className={cn("text-3xl font-display font-bold", config.color)}>
              {score.toFixed(1)}
            </span>
            <span className="text-muted-foreground text-sm">/ 10</span>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-4 rounded-xl font-semibold bg-white/10 border border-white/10 text-foreground hover:bg-white/15 transition-all"
          >
            View Detailed Review →
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

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
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.questions.list(),
  });
  
  const analyzeMutation = useMutation({ mutationFn: api.analyze });
  const saveAnswerMutation = useMutation({ mutationFn: api.answers.save });
  const endSessionMutation = useMutation({
    mutationFn: (id: number) => api.sessions.end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const { isRecording, transcript, isSupported, toggleRecording, setTranscript } = useVoiceRecording();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswer, setLocalAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnalysisResult | null>(null);
  const [verdictData, setVerdictData] = useState<{ score: number; sessionId: number } | null>(null);
  const [localScores, setLocalScores] = useState<number[]>([]);

  useEffect(() => {
    if (transcript) {
      setLocalAnswer(prev => prev ? prev + " " + transcript : transcript);
      setTranscript("");
    }
  }, [transcript, setTranscript]);

  if (sessionLoading || questionsLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!session || !questions || questions.length === 0) {
    return <div className="text-center mt-20 text-muted-foreground">Session or questions not found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex % questions.length];

  const handleSubmit = async () => {
    if (!localAnswer.trim()) {
      toast({ title: "Empty Answer", description: "Please provide an answer before submitting.", variant: "destructive" });
      return;
    }

    if (isRecording) {
      toggleRecording();
    }

    try {
      const analysisResult = await analyzeMutation.mutateAsync({
        questionText: currentQuestion.text,
        answerText: localAnswer,
        role: session.role,
        sessionId: session.id,
        questionId: currentQuestion.id
      });

      await saveAnswerMutation.mutateAsync({
        sessionId: session.id,
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answerText: localAnswer,
        analysisResult
      });

      setLocalScores(prev => [...prev, analysisResult.overallScore]);
      setFeedback(analysisResult);
      refetchSession();
      
    } catch (error) {
      toast({ title: "Analysis Failed", description: "Something went wrong analyzing your answer.", variant: "destructive" });
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setLocalAnswer("");
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleEndSession = async () => {
    if (localScores.length === 0 && session.answers.length === 0) {
      toast({ title: "No answers yet", description: "Answer at least one question before ending.", variant: "destructive" });
      return;
    }
    try {
      await endSessionMutation.mutateAsync(session.id);
      const allScores = [
        ...localScores,
        ...session.answers.map(a => a.overallScore != null ? Number(a.overallScore) : null).filter(Boolean) as number[]
      ];
      const avgScore = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 5;
      setVerdictData({ score: avgScore, sessionId: session.id });
    } catch (error) {
      toast({ title: "Error", description: "Failed to end session", variant: "destructive" });
    }
  };

  const isAnalyzing = analyzeMutation.isPending || saveAnswerMutation.isPending;
  const answeredCount = (session.answers?.length || 0) + localScores.length;

  return (
    <>
      {verdictData && (
        <VerdictOverlay
          score={verdictData.score}
          onContinue={() => {
            window.location.href = `/session/${verdictData.sessionId}/review`;
          }}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                Question {currentQuestionIndex + 1}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{session.role}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-display font-bold leading-relaxed text-foreground flex-1">
              "{currentQuestion.text}"
            </h2>

            <div className="mt-8 space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" /> Category: <span className="text-foreground capitalize">{currentQuestion.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flag className="w-4 h-4" /> Difficulty: 
                <span className={cn(
                  "capitalize font-medium",
                  currentQuestion.difficulty === 'hard' ? "text-rose-400" :
                  currentQuestion.difficulty === 'medium' ? "text-amber-400" : "text-emerald-400"
                )}>{currentQuestion.difficulty}</span>
              </div>
              {answeredCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{answeredCount} question{answeredCount !== 1 ? "s" : ""} answered</span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleEndSession}
            disabled={endSessionMutation.isPending}
            className="px-6 py-4 rounded-2xl border border-destructive/20 text-destructive font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {endSessionMutation.isPending ? "Ending..." : "End Session & Get Verdict"}
          </button>
        </div>

        <div className="lg:w-2/3 flex flex-col h-full relative">
          <AnimatePresence mode="wait">
            {!feedback && !isAnalyzing ? (
              <motion.div 
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 rounded-3xl flex-1 flex flex-col relative overflow-hidden"
              >
                {isRecording && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-400 animate-pulse" />
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg">Your Response</h3>
                  {isRecording && (
                    <span className="flex items-center gap-2 text-rose-400 text-sm font-medium bg-rose-400/10 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Listening...
                    </span>
                  )}
                </div>

                <textarea
                  value={localAnswer}
                  onChange={(e) => setLocalAnswer(e.target.value)}
                  placeholder="Type your answer here, or click the microphone to speak..."
                  className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/50 p-0 outline-none"
                />

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isSupported ? (
                      <button
                        onClick={toggleRecording}
                        className={cn(
                          "flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg",
                          isRecording 
                            ? "bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-600 hover:scale-105" 
                            : "bg-white/5 text-foreground hover:bg-white/10 hover:scale-105"
                        )}
                      >
                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Voice not supported in this browser.</span>
                    )}
                    
                    {isRecording && <span className="text-sm text-muted-foreground animate-pulse">Speak clearly into your microphone...</span>}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!localAnswer.trim()}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Submit Answer <Send className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel p-12 rounded-3xl flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2 text-foreground">AI is analyzing your response</h3>
                <p className="text-muted-foreground max-w-sm">
                  Evaluating clarity, technical depth, and extracting actionable feedback...
                </p>
              </motion.div>
            ) : feedback ? (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-border bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg leading-tight">Analysis Complete</h3>
                      <p className="text-sm text-muted-foreground">Here is how you did.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Overall</span>
                    <div className={cn("px-4 py-2 rounded-xl font-bold text-xl border", getScoreBg(feedback.overallScore), getScoreColor(feedback.overallScore))}>
                      {feedback.overallScore.toFixed(1)} <span className="text-sm opacity-50">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <ScoreGauge score={feedback.clarityScore} label="Clarity" size="sm" />
                    <ScoreGauge score={feedback.confidenceScore} label="Confidence" size="sm" />
                    <ScoreGauge score={feedback.technicalDepthScore} label="Tech Depth" size="sm" />
                    <ScoreGauge score={feedback.communicationScore} label="Comm." size="sm" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" /> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {feedback.strengths?.map((s: string, i: number) => (
                          <li key={i} className="text-sm bg-emerald-400/5 border border-emerald-400/10 p-3 rounded-lg text-emerald-100/80 leading-relaxed">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-rose-400">
                        <AlertCircle className="w-5 h-5" /> Areas to Improve
                      </h4>
                      <ul className="space-y-2">
                        {feedback.weaknesses?.map((w: string, i: number) => (
                          <li key={i} className="text-sm bg-rose-400/5 border border-rose-400/10 p-3 rounded-lg text-rose-100/80 leading-relaxed">
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                      <h4 className="flex items-center gap-2 font-bold text-primary mb-3">
                        <Lightbulb className="w-5 h-5" /> Improved Answer Suggestion
                      </h4>
                      <p className="text-sm text-primary-foreground/80 leading-relaxed italic border-l-2 border-primary/50 pl-4">
                        "{feedback.improvedAnswer}"
                      </p>
                    </div>

                    {feedback.followUpQuestions?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-accent" /> Follow-up Questions to Consider
                        </h4>
                        <div className="flex flex-col gap-2">
                          {feedback.followUpQuestions.map((q: string, i: number) => (
                            <div key={i} className="text-sm text-muted-foreground bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                              {q}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-border bg-black/20 flex justify-between items-center">
                  <button
                    onClick={handleEndSession}
                    disabled={endSessionMutation.isPending}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    End & Get Verdict
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-300"
                  >
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
