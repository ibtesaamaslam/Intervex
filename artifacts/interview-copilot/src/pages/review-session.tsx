import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, ArrowLeft, Calendar, User, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ReviewSession() {
  const [, params] = useRoute("/session/:id/review");
  const sessionId = parseInt(params?.id || "0");
  
  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.sessions.get(sessionId),
    enabled: sessionId > 0,
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return <div className="text-center mt-20">Session not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </Link>
        
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold mb-3">{session.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {session.role}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(session.createdAt), "PPP")}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full border text-xs font-bold uppercase",
                  session.status === 'completed' ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-amber-400/10 border-amber-400/20 text-amber-400"
                )}>
                  {session.status}
                </span>
              </div>
            </div>
            
            {session.overallScore !== null && session.overallScore !== undefined && (
              <div className="bg-background/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Session Avg</div>
                  <div className="text-3xl font-display font-bold">{Number(session.overallScore).toFixed(1)}</div>
                </div>
                <ScoreGauge score={Number(session.overallScore)} label="" size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-display font-bold mb-6 px-2">Q&A Review ({session.answers.length})</h2>

      <div className="space-y-4">
        {session.answers.map((answer, index) => {
          const isExpanded = expandedId === answer.id;
          return (
            <motion.div 
              key={answer.id}
              layout
              className="glass-card rounded-2xl overflow-hidden border border-white/5"
            >
              <button 
                onClick={() => setExpandedId(isExpanded ? null : answer.id)}
                className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Question {index + 1}</div>
                  <h3 className="text-lg font-medium text-foreground leading-snug">"{answer.questionText}"</h3>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {answer.overallScore !== null && answer.overallScore !== undefined && (
                    <div className={cn(
                      "px-3 py-1 rounded-full font-bold text-sm",
                      Number(answer.overallScore) >= 8 ? "bg-emerald-400/10 text-emerald-400" :
                      Number(answer.overallScore) >= 6 ? "bg-amber-400/10 text-amber-400" : "bg-rose-400/10 text-rose-400"
                    )}>
                      {Number(answer.overallScore).toFixed(1)}
                    </div>
                  )}
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/5 bg-black/20"
                  >
                    <div className="p-6 space-y-8">
                      <div>
                        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Your Answer</div>
                        <p className="text-foreground/80 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                          {answer.answerText}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-background/50 p-4 rounded-xl border border-white/5 text-center">
                          <div className="text-2xl font-display font-bold text-foreground mb-1">{answer.clarityScore != null ? Number(answer.clarityScore).toFixed(1) : '-'}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Clarity</div>
                        </div>
                        <div className="bg-background/50 p-4 rounded-xl border border-white/5 text-center">
                          <div className="text-2xl font-display font-bold text-foreground mb-1">{answer.confidenceScore != null ? Number(answer.confidenceScore).toFixed(1) : '-'}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</div>
                        </div>
                        <div className="bg-background/50 p-4 rounded-xl border border-white/5 text-center">
                          <div className="text-2xl font-display font-bold text-foreground mb-1">{answer.technicalDepthScore != null ? Number(answer.technicalDepthScore).toFixed(1) : '-'}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Tech Depth</div>
                        </div>
                        <div className="bg-background/50 p-4 rounded-xl border border-white/5 text-center">
                          <div className="text-2xl font-display font-bold text-foreground mb-1">{answer.communicationScore != null ? Number(answer.communicationScore).toFixed(1) : '-'}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Comm.</div>
                        </div>
                      </div>

                      {answer.feedback && (
                        <div>
                          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">AI Feedback Summary</div>
                          <p className="text-foreground/80 leading-relaxed">{answer.feedback}</p>
                        </div>
                      )}

                      {answer.improvedAnswer && (
                        <div>
                          <div className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Suggested Improvement</div>
                          <p className="text-primary-foreground/80 leading-relaxed bg-primary/10 p-4 rounded-xl border border-primary/20 italic">
                            "{answer.improvedAnswer}"
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
