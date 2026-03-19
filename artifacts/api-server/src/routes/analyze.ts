import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod/v4";

const router: IRouter = Router();

const analyzeSchema = z.object({
  questionText: z.string().min(1),
  answerText: z.string().min(1),
  role: z.string().min(1),
  sessionId: z.number().int().optional().nullable(),
  questionId: z.number().int().optional().nullable(),
});

router.post("/", async (req, res) => {
  const body = analyzeSchema.parse(req.body);

  const prompt = `You are an expert interview coach and evaluator. Analyze the following interview answer and provide structured feedback.

Role being interviewed for: ${body.role}
Question: ${body.questionText}
Answer: ${body.answerText}

Evaluate the answer on these dimensions (score each 0-10):
1. Clarity (how clear, structured, and easy to understand the answer is)
2. Confidence (tone, assertiveness, ownership of experience)
3. Technical Depth (relevance and depth of technical knowledge shown)
4. Communication (use of language, storytelling, conciseness)

Return ONLY valid JSON with this exact structure:
{
  "clarityScore": <number 0-10>,
  "confidenceScore": <number 0-10>,
  "technicalDepthScore": <number 0-10>,
  "communicationScore": <number 0-10>,
  "overallScore": <average of above>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "improvedAnswer": "<a better version of the answer, 2-4 sentences>",
  "followUpQuestions": ["<follow-up question 1>", "<follow-up question 2>", "<follow-up question 3>"],
  "feedback": "<2-3 sentence overall coaching feedback>"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: "You are an expert interview coach. Always respond with valid JSON only, no markdown code blocks." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  res.json({
    answerId: null,
    clarityScore: parsed.clarityScore ?? 5,
    confidenceScore: parsed.confidenceScore ?? 5,
    technicalDepthScore: parsed.technicalDepthScore ?? 5,
    communicationScore: parsed.communicationScore ?? 5,
    overallScore: parsed.overallScore ?? 5,
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    improvedAnswer: parsed.improvedAnswer ?? "",
    followUpQuestions: parsed.followUpQuestions ?? [],
    feedback: parsed.feedback ?? "",
  });
});

export default router;
