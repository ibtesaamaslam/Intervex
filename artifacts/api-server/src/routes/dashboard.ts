import { Router, type IRouter } from "express";
import { db, sessionsTable, answersTable } from "@workspace/db";
import { desc, avg, count, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

function computeStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;
  const days = [...new Set(sessionDates.map(d => d.toISOString().slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function computeBadges(params: {
  totalSessions: number;
  totalAnswers: number;
  avgOverall: number | null;
  avgTechnical: number | null;
  streak: number;
  maxScore: number | null;
  avgStarScore: number | null;
  firstSessionScore: number | null;
  latestSessionScore: number | null;
  hiredCount: number;
}): Array<{ id: string; label: string; description: string; earned: boolean; icon: string }> {
  return [
    {
      id: "first_hire",
      label: "You're Hired!",
      description: "Earn a 'Hired' verdict (score ≥ 7.5) in any session",
      earned: params.hiredCount > 0,
      icon: "Trophy",
    },
    {
      id: "practice_pro",
      label: "Practice Pro",
      description: "Complete 5 or more sessions",
      earned: params.totalSessions >= 5,
      icon: "Star",
    },
    {
      id: "tech_master",
      label: "Tech Master",
      description: "Achieve average technical depth score of 8+",
      earned: (params.avgTechnical ?? 0) >= 8,
      icon: "BrainCircuit",
    },
    {
      id: "seven_day_streak",
      label: "7-Day Streak",
      description: "Practice every day for 7 consecutive days",
      earned: params.streak >= 7,
      icon: "Flame",
    },
    {
      id: "perfect_score",
      label: "Flawless",
      description: "Score 9.5 or higher overall on any answer",
      earned: (params.maxScore ?? 0) >= 9.5,
      icon: "Sparkles",
    },
    {
      id: "star_storyteller",
      label: "STAR Storyteller",
      description: "Average STAR score of 8+ across all answers",
      earned: (params.avgStarScore ?? 0) >= 8,
      icon: "BookOpen",
    },
    {
      id: "comeback_kid",
      label: "Comeback Kid",
      description: "Improve your session score by 2+ points",
      earned:
        params.firstSessionScore != null &&
        params.latestSessionScore != null &&
        params.latestSessionScore - params.firstSessionScore >= 2,
      icon: "TrendingUp",
    },
    {
      id: "century",
      label: "Century Club",
      description: "Answer 100 interview questions",
      earned: params.totalAnswers >= 100,
      icon: "Award",
    },
  ];
}

router.get("/", async (_req, res) => {
  const [sessionCount] = await db.select({ count: count() }).from(sessionsTable);
  const [answerCount] = await db.select({ count: count() }).from(answersTable);

  const [scores] = await db.select({
    avgOverall: avg(answersTable.overallScore),
    avgClarity: avg(answersTable.clarityScore),
    avgConfidence: avg(answersTable.confidenceScore),
    avgTechnical: avg(answersTable.technicalDepthScore),
    avgCommunication: avg(answersTable.communicationScore),
    avgStar: avg(answersTable.starScore),
  }).from(answersTable);

  const [maxScoreRow] = await db.select({
    maxScore: sql<string>`MAX(${answersTable.overallScore})`,
  }).from(answersTable);

  const recentSessions = await db
    .select()
    .from(sessionsTable)
    .orderBy(desc(sessionsTable.createdAt))
    .limit(5);

  const allCompletedSessions = await db
    .select({ createdAt: sessionsTable.createdAt, overallScore: sessionsTable.overallScore })
    .from(sessionsTable)
    .where(eq(sessionsTable.status, "completed"))
    .orderBy(sessionsTable.createdAt);

  const scoreHistory = await db
    .select({
      date: sql<string>`DATE(${answersTable.createdAt})::text`,
      overallScore: avg(answersTable.overallScore),
      clarityScore: avg(answersTable.clarityScore),
      confidenceScore: avg(answersTable.confidenceScore),
      technicalDepthScore: avg(answersTable.technicalDepthScore),
      communicationScore: avg(answersTable.communicationScore),
    })
    .from(answersTable)
    .groupBy(sql`DATE(${answersTable.createdAt})`)
    .orderBy(sql`DATE(${answersTable.createdAt})`);

  const weakAreas = [
    { category: "Clarity", averageScore: scores?.avgClarity ? parseFloat(scores.avgClarity) : 0, sessionCount: Number(sessionCount.count) },
    { category: "Confidence", averageScore: scores?.avgConfidence ? parseFloat(scores.avgConfidence) : 0, sessionCount: Number(sessionCount.count) },
    { category: "Technical Depth", averageScore: scores?.avgTechnical ? parseFloat(scores.avgTechnical) : 0, sessionCount: Number(sessionCount.count) },
    { category: "Communication", averageScore: scores?.avgCommunication ? parseFloat(scores.avgCommunication) : 0, sessionCount: Number(sessionCount.count) },
  ].sort((a, b) => a.averageScore - b.averageScore);

  const streak = computeStreak(allCompletedSessions.map(s => s.createdAt));
  const hiredCount = allCompletedSessions.filter(s => s.overallScore && parseFloat(s.overallScore) >= 7.5).length;
  const firstScore = allCompletedSessions[0]?.overallScore ? parseFloat(allCompletedSessions[0].overallScore) : null;
  const latestScore = allCompletedSessions.at(-1)?.overallScore ? parseFloat(allCompletedSessions.at(-1)!.overallScore!) : null;

  const badges = computeBadges({
    totalSessions: Number(sessionCount.count),
    totalAnswers: Number(answerCount.count),
    avgOverall: scores?.avgOverall ? parseFloat(scores.avgOverall) : null,
    avgTechnical: scores?.avgTechnical ? parseFloat(scores.avgTechnical) : null,
    streak,
    maxScore: maxScoreRow?.maxScore ? parseFloat(maxScoreRow.maxScore) : null,
    avgStarScore: scores?.avgStar ? parseFloat(scores.avgStar) : null,
    firstSessionScore: firstScore,
    latestSessionScore: latestScore,
    hiredCount,
  });

  res.json({
    totalSessions: Number(sessionCount.count),
    totalAnswers: Number(answerCount.count),
    averageOverallScore: scores?.avgOverall ? parseFloat(scores.avgOverall) : null,
    averageClarityScore: scores?.avgClarity ? parseFloat(scores.avgClarity) : null,
    averageConfidenceScore: scores?.avgConfidence ? parseFloat(scores.avgConfidence) : null,
    averageTechnicalDepthScore: scores?.avgTechnical ? parseFloat(scores.avgTechnical) : null,
    averageCommunicationScore: scores?.avgCommunication ? parseFloat(scores.avgCommunication) : null,
    streak,
    badges,
    recentSessions: recentSessions.map(s => ({
      id: s.id,
      title: s.title,
      role: s.role,
      company: s.company ?? null,
      status: s.status,
      overallScore: s.overallScore ? parseFloat(s.overallScore) : null,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
    })),
    weakAreas,
    scoreHistory: scoreHistory.map(h => ({
      date: h.date,
      overallScore: h.overallScore ? parseFloat(h.overallScore) : 0,
      clarityScore: h.clarityScore ? parseFloat(h.clarityScore) : 0,
      confidenceScore: h.confidenceScore ? parseFloat(h.confidenceScore) : 0,
      technicalDepthScore: h.technicalDepthScore ? parseFloat(h.technicalDepthScore) : 0,
      communicationScore: h.communicationScore ? parseFloat(h.communicationScore) : 0,
    })),
  });
});

export default router;
