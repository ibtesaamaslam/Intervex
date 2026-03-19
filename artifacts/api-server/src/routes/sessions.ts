import { Router, type IRouter } from "express";
import { db, sessionsTable, answersTable } from "@workspace/db";
import { eq, desc, avg } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const createSessionSchema = z.object({
  title: z.string().min(1),
  role: z.string().min(1),
});

router.get("/", async (_req, res) => {
  const sessions = await db
    .select()
    .from(sessionsTable)
    .orderBy(desc(sessionsTable.createdAt));
  res.json(sessions.map(s => ({
    id: s.id,
    title: s.title,
    role: s.role,
    status: s.status,
    overallScore: s.overallScore ? parseFloat(s.overallScore) : null,
    createdAt: s.createdAt,
    endedAt: s.endedAt,
  })));
});

router.post("/", async (req, res) => {
  const body = createSessionSchema.parse(req.body);
  const [session] = await db.insert(sessionsTable).values({
    title: body.title,
    role: body.role,
    status: "active",
  }).returning();
  res.status(201).json({
    id: session.id,
    title: session.title,
    role: session.role,
    status: session.status,
    overallScore: null,
    createdAt: session.createdAt,
    endedAt: null,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const answers = await db.select().from(answersTable).where(eq(answersTable.sessionId, id)).orderBy(answersTable.createdAt);
  res.json({
    id: session.id,
    title: session.title,
    role: session.role,
    status: session.status,
    overallScore: session.overallScore ? parseFloat(session.overallScore) : null,
    createdAt: session.createdAt,
    endedAt: session.endedAt,
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
  const [session] = await db
    .update(sessionsTable)
    .set({ status: "completed", endedAt: new Date(), overallScore: overallScore ?? undefined })
    .where(eq(sessionsTable.id, id))
    .returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({
    id: session.id,
    title: session.title,
    role: session.role,
    status: session.status,
    overallScore: session.overallScore ? parseFloat(session.overallScore) : null,
    createdAt: session.createdAt,
    endedAt: session.endedAt,
  });
});

export default router;
