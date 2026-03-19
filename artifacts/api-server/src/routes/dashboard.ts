import { Router, type IRouter } from "express";
import { db, sessionsTable, answersTable } from "@workspace/db";
import { desc, avg, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const [sessionCount] = await db.select({ count: count() }).from(sessionsTable);
  const [answerCount] = await db.select({ count: count() }).from(answersTable);

  const [scores] = await db.select({
    avgOverall: avg(answersTable.overallScore),
    avgClarity: avg(answersTable.clarityScore),
    avgConfidence: avg(answersTable.confidenceScore),
    avgTechnical: avg(answersTable.technicalDepthScore),
    avgCommunication: avg(answersTable.communicationScore),
  }).from(answersTable);

  const recentSessions = await db
    .select()
    .from(sessionsTable)
    .orderBy(desc(sessionsTable.createdAt))
    .limit(5);

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

  res.json({
    totalSessions: Number(sessionCount.count),
    totalAnswers: Number(answerCount.count),
    averageOverallScore: scores?.avgOverall ? parseFloat(scores.avgOverall) : null,
    averageClarityScore: scores?.avgClarity ? parseFloat(scores.avgClarity) : null,
    averageConfidenceScore: scores?.avgConfidence ? parseFloat(scores.avgConfidence) : null,
    averageTechnicalDepthScore: scores?.avgTechnical ? parseFloat(scores.avgTechnical) : null,
    averageCommunicationScore: scores?.avgCommunication ? parseFloat(scores.avgCommunication) : null,
    recentSessions: recentSessions.map(s => ({
      id: s.id,
      title: s.title,
      role: s.role,
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
