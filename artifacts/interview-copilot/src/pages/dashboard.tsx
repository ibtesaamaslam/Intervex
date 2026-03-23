import { useQuery } from "@tanstack/react-query";
import { api, type Badge } from "@/lib/api";
import { Loader2, TrendingUp, Mic, Target, Zap, Flame, Trophy, Star, BrainCircuit, BookOpen, Sparkles, Award, Lock } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { format } from "date-fns";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<string, React.ElementType> = {
  Trophy, Star, BrainCircuit, Flame, Sparkles, BookOpen, TrendingUp, Award,
};

function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = BADGE_ICONS[badge.icon] ?? Award;
  return (
    <div className={cn(
      "p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all",
      badge.earned
        ? "bg-primary/5 border-primary/20"
        : "bg-secondary/20 border-border/30 opacity-50"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center border",
        badge.earned ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-border text-muted-foreground"
      )}>
        {badge.earned ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
      </div>
      <div>
        <div className={cn("text-sm font-bold", badge.earned ? "text-foreground" : "text-muted-foreground")}>{badge.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{badge.description}</div>
      </div>
      {badge.earned && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">Earned</span>
      )}
    </div>
  );
}

function StreakDisplay({ streak }: { streak: number }) {
  return (
    <div className={cn(
      "flex items-center gap-4 px-6 py-4 rounded-2xl border",
      streak >= 7 ? "bg-amber-400/10 border-amber-400/30" :
      streak >= 3 ? "bg-orange-400/10 border-orange-400/30" :
      streak >= 1 ? "bg-primary/10 border-primary/30" : "bg-secondary/50 border-border"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
        streak >= 1 ? "bg-amber-400/20" : "bg-secondary"
      )}>
        🔥
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-foreground">{streak} day{streak !== 1 ? "s" : ""}</div>
        <div className="text-sm text-muted-foreground">
          {streak === 0 ? "Practice today to start a streak!" :
           streak >= 7 ? "You're on fire! 🔥 7+ day streak" :
           streak >= 3 ? "Great momentum — keep going!" :
           "Building your streak — come back tomorrow!"}
        </div>
      </div>
      {streak >= 7 && (
        <div className="ml-auto px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-bold">
          Hot Streak
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard.get,
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return <div className="text-center mt-20 text-muted-foreground">Failed to load dashboard data.</div>;
  }

  const chartData = data.scoreHistory.map(entry => ({
    ...entry,
    displayDate: format(new Date(entry.date), "MMM d"),
  }));

  const earnedBadges = data.badges.filter(b => b.earned).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Performance Dashboard</h1>
          <p className="text-muted-foreground">Track your interview skills over time.</p>
        </div>
        <Link href="/session/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
            <Zap className="w-4 h-4" /> New Session
          </button>
        </Link>
      </div>

      {/* Streak */}
      <StreakDisplay streak={data.streak} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: data.totalSessions, icon: Target, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Questions Answered", value: data.totalAnswers, icon: Mic, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Avg Overall Score", value: data.averageOverallScore != null ? Number(data.averageOverallScore).toFixed(1) : "—", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: "Badges Earned", value: `${earnedBadges}/${data.badges.length}`, icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Skill Breakdown */}
      <div className="glass-panel p-8 rounded-3xl">
        <h3 className="text-lg font-bold font-display mb-6">Skill Breakdown (All Time)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <ScoreGauge score={data.averageClarityScore != null ? Number(data.averageClarityScore) : 0} label="Clarity" size="lg" />
          <ScoreGauge score={data.averageConfidenceScore != null ? Number(data.averageConfidenceScore) : 0} label="Confidence" size="lg" />
          <ScoreGauge score={data.averageTechnicalDepthScore != null ? Number(data.averageTechnicalDepthScore) : 0} label="Tech Depth" size="lg" />
          <ScoreGauge score={data.averageCommunicationScore != null ? Number(data.averageCommunicationScore) : 0} label="Communication" size="lg" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl h-[360px] flex flex-col">
          <h3 className="text-lg font-bold font-display mb-4">Score History</h3>
          <div className="flex-1 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} itemStyle={{ fontWeight: 600 }} />
                  <Line type="monotone" dataKey="overallScore" name="Overall" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="clarityScore" name="Clarity" stroke="#34d399" strokeWidth={2} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="technicalDepthScore" name="Tech Depth" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} opacity={0.7} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <p>Complete your first session to see score history.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl h-[360px] flex flex-col">
          <h3 className="text-lg font-bold font-display mb-4">Weak Areas</h3>
          <div className="flex-1 min-h-0">
            {data.weakAreas && data.weakAreas.some(w => w.averageScore > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weakAreas} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis dataKey="category" type="category" stroke="#ffffff80" fontSize={11} tickLine={false} axisLine={false} width={105} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="averageScore" name="Avg Score" radius={[0, 4, 4, 0]} barSize={18}>
                    {data.weakAreas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.averageScore < 6 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 text-center px-4">
                <Target className="w-8 h-8 opacity-30" />
                <p className="text-sm">Answer more questions to identify your weak areas.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-panel p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold font-display">Badges</h3>
            <p className="text-sm text-muted-foreground">{earnedBadges} of {data.badges.length} earned</p>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: data.badges.length }).map((_, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full", i < earnedBadges ? "bg-primary" : "bg-border")} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      </div>

      {/* Recent Sessions */}
      {data.recentSessions && data.recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display">Recent Sessions</h3>
            <Link href="/"><span className="text-primary hover:underline cursor-pointer text-sm">View all</span></Link>
          </div>
          <div className="space-y-2">
            {data.recentSessions.map(session => (
              <Link key={session.id} href={`/session/${session.id}/review`}>
                <div className="glass-card p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                  <div>
                    <div className="font-medium text-foreground">{session.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.role}{session.company ? ` · ${session.company}` : ""} · {format(new Date(session.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
                      session.status === "completed" ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-amber-400/10 border-amber-400/20 text-amber-400"
                    )}>{session.status}</span>
                    {session.overallScore != null && (
                      <div className="text-lg font-bold text-primary">{Number(session.overallScore).toFixed(1)}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Drill Mode CTA */}
      {data.weakAreas && data.weakAreas.some(w => w.averageScore < 6 && w.averageScore > 0) && (
        <div className="glass-panel p-6 rounded-3xl border border-rose-400/20 bg-rose-400/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="font-bold text-foreground">Drill Mode Available</div>
                <div className="text-sm text-muted-foreground">
                  Your weakest area is <span className="text-rose-400 font-medium">{data.weakAreas[0]?.category}</span> — practice it with a focused session.
                </div>
              </div>
            </div>
            <Link href="/session/new">
              <button className="px-4 py-2 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm font-medium hover:bg-rose-400/20 transition-colors whitespace-nowrap">
                Start Drill
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
