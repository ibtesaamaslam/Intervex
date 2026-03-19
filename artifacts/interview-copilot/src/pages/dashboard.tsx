import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, TrendingUp, Mic, Target, Zap } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { format } from "date-fns";
import { Link } from "wouter";

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
    displayDate: format(new Date(entry.date), "MMM d")
  })).reverse();

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Performance Dashboard</h1>
        <p className="text-muted-foreground">Track your interview skills over time.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: data.totalSessions, icon: Target, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Questions Answered", value: data.totalAnswers, icon: Mic, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Avg Overall", value: data.averageOverallScore != null ? Number(data.averageOverallScore).toFixed(1) : "-", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: "Avg Tech Depth", value: data.averageTechnicalDepthScore != null ? Number(data.averageTechnicalDepthScore).toFixed(1) : "-", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
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

      <div className="glass-panel p-8 rounded-3xl">
        <h3 className="text-lg font-bold font-display mb-6">Skill Breakdown (All Time)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <ScoreGauge score={data.averageClarityScore != null ? Number(data.averageClarityScore) : 0} label="Clarity" size="lg" />
          <ScoreGauge score={data.averageConfidenceScore != null ? Number(data.averageConfidenceScore) : 0} label="Confidence" size="lg" />
          <ScoreGauge score={data.averageTechnicalDepthScore != null ? Number(data.averageTechnicalDepthScore) : 0} label="Tech Depth" size="lg" />
          <ScoreGauge score={data.averageCommunicationScore != null ? Number(data.averageCommunicationScore) : 0} label="Communication" size="lg" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-lg font-bold font-display mb-6">Score History</h3>
          <div className="flex-1 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="overallScore" name="Overall" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="technicalDepthScore" name="Tech Depth" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} opacity={0.7} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data to show history.</div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-lg font-bold font-display mb-6">Weakest Categories</h3>
          <div className="flex-1 min-h-0">
            {data.weakAreas && data.weakAreas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weakAreas} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis dataKey="category" type="category" stroke="#ffffff80" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="averageScore" name="Avg Score" radius={[0, 4, 4, 0]} barSize={20}>
                    {data.weakAreas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.averageScore < 6 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center px-4">
                Answer more questions to identify weak areas.
              </div>
            )}
          </div>
        </div>
      </div>

      {data.recentSessions && data.recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display">Recent Sessions</h3>
            <Link href="/">
              <span className="text-primary hover:underline cursor-pointer text-sm">View all</span>
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentSessions.map(session => (
              <Link key={session.id} href={`/session/${session.id}/review`}>
                <div className="glass-card p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                  <div>
                    <div className="font-medium text-foreground">{session.title}</div>
                    <div className="text-sm text-muted-foreground">{session.role} · {format(new Date(session.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  {session.overallScore != null && (
                    <div className="text-lg font-bold text-primary">{Number(session.overallScore).toFixed(1)}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
