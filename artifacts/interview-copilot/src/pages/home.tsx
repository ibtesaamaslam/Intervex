import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Mic, BrainCircuit, Target, Sparkles, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function Home() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: api.sessions.list,
  });

  return (
    <div className="space-y-16 pb-12">
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 mt-4">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
        
        <div className="relative z-10 px-6 py-20 sm:px-12 sm:py-24 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Interview Prep</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-display font-bold leading-tight mb-6">
              Master your next interview with <span className="text-gradient">Real-Time AI Feedback</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Practice answering questions with your voice. Get instant, granular feedback on your clarity, confidence, and technical depth.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/session/new">
                <button className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-primary text-primary-foreground shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 transition-all duration-300">
                  Start Practicing <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition-all duration-300">
                  View Performance
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Mic, title: "Voice Transcription", desc: "Speak naturally. Our AI transcribes and analyzes your delivery." },
          { icon: BrainCircuit, title: "Deep Analysis", desc: "Get scored on clarity, technical depth, and communication skills." },
          { icon: Target, title: "Actionable Advice", desc: "Receive improved answer suggestions and tough follow-up questions." }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">{feature.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display">Recent Sessions</h2>
          <Link href="/dashboard">
            <span className="text-primary hover:underline cursor-pointer text-sm font-medium">View all</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.slice(0, 3).map((session) => (
              <Link key={session.id} href={`/session/${session.id}/review`}>
                <div className="glass-card p-6 rounded-2xl cursor-pointer group hover:-translate-y-1 transition-transform duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground">
                      {session.role}
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      session.status === 'completed' ? "bg-emerald-400" : "bg-amber-400"
                    )} />
                  </div>
                  <h3 className="text-lg font-bold font-display text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {session.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {format(new Date(session.createdAt), "MMM d, yyyy • h:mm a")}
                  </p>
                  
                  {session.overallScore !== null && session.overallScore !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", session.overallScore >= 7 ? "bg-primary" : "bg-amber-400")}
                          style={{ width: `${(session.overallScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{Number(session.overallScore).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl border-dashed">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No sessions yet</h3>
            <p className="text-muted-foreground mt-1 mb-6">Start your first practice interview to see it here.</p>
            <Link href="/session/new">
              <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Create Session
              </button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
