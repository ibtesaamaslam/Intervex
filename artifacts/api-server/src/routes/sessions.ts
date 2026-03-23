import { Router, type IRouter } from "express";
import { db, sessionsTable, answersTable } from "@workspace/db";
import { eq, desc, avg } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const createSessionSchema = z.object({
  title: z.string().min(1),
  role: z.string().min(1),
  company: z.string().optional().nullable(),
  resumeText: z.string().optional().nullable(),
  persona: z.enum(["friendly", "tough", "technical"]).optional().default("friendly"),
  timedMode: z.boolean().optional().default(false),
  timePerQuestion: z.number().int().min(30).max(600).optional().default(120),
  targetDate: z.string().optional().nullable(),
  drillMode: z.boolean().optional().default(false),
});

function formatSession(s: typeof sessionsTable.$inferSelect) {
  return {
    id: s.id,
    title: s.title,
    role: s.role,
    company: s.company ?? null,
    resumeText: s.resumeText ?? null,
    persona: s.persona ?? "friendly",
    timedMode: s.timedMode ?? false,
    timePerQuestion: s.timePerQuestion ?? 120,
    targetDate: s.targetDate?.toISOString() ?? null,
    drillMode: s.drillMode ?? false,
    status: s.status,
    overallScore: s.overallScore ? parseFloat(s.overallScore) : null,
    createdAt: s.createdAt,
    endedAt: s.endedAt,
  };
}

router.get("/", async (_req, res) => {
  const sessions = await db.select().from(sessionsTable).orderBy(desc(sessionsTable.createdAt));
  res.json(sessions.map(formatSession));
});

router.post("/", async (req, res) => {
  const body = createSessionSchema.parse(req.body);
  const [session] = await db.insert(sessionsTable).values({
    title: body.title,
    role: body.role,
    company: body.company ?? null,
    resumeText: body.resumeText ?? null,
    persona: body.persona,
    timedMode: body.timedMode,
    timePerQuestion: body.timePerQuestion,
    targetDate: body.targetDate ? new Date(body.targetDate) : null,
    drillMode: body.drillMode,
    status: "active",
  }).returning();
  res.status(201).json(formatSession(session));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  const answers = await db.select().from(answersTable).where(eq(answersTable.sessionId, id)).orderBy(answersTable.createdAt);
  res.json({
    ...formatSession(session),
    answers: answers.map(a => ({
      id: a.id,
      sessionId: a.sessionId,
      questionId: a.questionId,
      questionText: a.questionText,
      answerText: a.answerText,
      clarityScore: a.clarityScore ? parseFloat(a.clarityScore) : null,
      confidenceScore: a.confidenceScore ? parseFloat(a.confidenceScore) : null,
      technicalDepthScore: a.technicalDepthScore ? parseFloat(a.technicalDepthScore) : null,
      communicationScore: a.communicationScore ? parseFloat(a.communicationScore) : null,
      overallScore: a.overallScore ? parseFloat(a.overallScore) : null,
      starScore: a.starScore ? parseFloat(a.starScore) : null,
      fillerWordCount: a.fillerWordCount ?? 0,
      toneAnalysis: a.toneAnalysis ?? null,
      strengths: a.strengths,
      weaknesses: a.weaknesses,
      improvedAnswer: a.improvedAnswer,
      followUpQuestions: a.followUpQuestions,
      feedback: a.feedback,
      createdAt: a.createdAt,
    })),
  });
});

router.post("/:id/end", async (req, res) => {
  const id = parseInt(req.params.id);
  const answers = await db.select().from(answersTable).where(eq(answersTable.sessionId, id));
  let overallScore: string | null = null;
  if (answers.length > 0) {
    const scores = answers.map(a => a.overallScore ? parseFloat(a.overallScore) : 0).filter(s => s > 0);
    if (scores.length > 0) {
      overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    }
  }
  const [session] = await db.update(sessionsTable)
    .set({ status: "completed", endedAt: new Date(), overallScore: overallScore ?? undefined })
    .where(eq(sessionsTable.id, id))
    .returning();
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  res.json(formatSession(session));
});

export default router;
