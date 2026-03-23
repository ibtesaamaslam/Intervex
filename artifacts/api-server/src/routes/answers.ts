import { Router, type IRouter } from "express";
import { db, answersTable } from "@workspace/db";
import { z } from "zod/v4";

const router: IRouter = Router();

const saveAnswerSchema = z.object({
  sessionId: z.number().int(),
  questionId: z.number().int().optional().nullable(),
  questionText: z.string().min(1),
  answerText: z.string().min(1),
  analysisResult: z.object({
    clarityScore: z.number(),
    confidenceScore: z.number(),
    technicalDepthScore: z.number(),
    communicationScore: z.number(),
    overallScore: z.number(),
    starScore: z.number().optional(),
    fillerWordCount: z.number().optional(),
    toneAnalysis: z.string().optional(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    improvedAnswer: z.string(),
    followUpQuestions: z.array(z.string()),
    feedback: z.string(),
    starFeedback: z.string().optional(),
  }).optional().nullable(),
});

router.post("/", async (req, res) => {
  const body = saveAnswerSchema.parse(req.body);
  const ar = body.analysisResult;
  const [answer] = await db.insert(answersTable).values({
    sessionId: body.sessionId,
    questionId: body.questionId ?? null,
    questionText: body.questionText,
    answerText: body.answerText,
    clarityScore: ar ? ar.clarityScore.toFixed(2) : null,
    confidenceScore: ar ? ar.confidenceScore.toFixed(2) : null,
    technicalDepthScore: ar ? ar.technicalDepthScore.toFixed(2) : null,
    communicationScore: ar ? ar.communicationScore.toFixed(2) : null,
    overallScore: ar ? ar.overallScore.toFixed(2) : null,
    starScore: ar?.starScore != null ? ar.starScore.toFixed(2) : null,
    fillerWordCount: ar?.fillerWordCount ?? 0,
    toneAnalysis: ar?.toneAnalysis ?? null,
    strengths: ar ? ar.strengths : null,
    weaknesses: ar ? ar.weaknesses : null,
    improvedAnswer: ar ? ar.improvedAnswer : null,
    followUpQuestions: ar ? ar.followUpQuestions : null,
    feedback: ar ? ar.feedback : null,
  }).returning();

  res.status(201).json({
    id: answer.id,
    sessionId: answer.sessionId,
    questionId: answer.questionId,
    questionText: answer.questionText,
    answerText: answer.answerText,
    clarityScore: answer.clarityScore ? parseFloat(answer.clarityScore) : null,
    confidenceScore: answer.confidenceScore ? parseFloat(answer.confidenceScore) : null,
    technicalDepthScore: answer.technicalDepthScore ? parseFloat(answer.technicalDepthScore) : null,
    communicationScore: answer.communicationScore ? parseFloat(answer.communicationScore) : null,
    overallScore: answer.overallScore ? parseFloat(answer.overallScore) : null,
    starScore: answer.starScore ? parseFloat(answer.starScore) : null,
    fillerWordCount: answer.fillerWordCount ?? 0,
    toneAnalysis: answer.toneAnalysis ?? null,
    strengths: answer.strengths,
    weaknesses: answer.weaknesses,
    improvedAnswer: answer.improvedAnswer,
    followUpQuestions: answer.followUpQuestions,
    feedback: answer.feedback,
    createdAt: answer.createdAt,
  });
});

export default router;
