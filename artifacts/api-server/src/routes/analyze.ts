import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod/v4";

const router: IRouter = Router();

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "sort of", "kind of", "i mean", "i guess", "right", "so", "actually", "just"];

function countFillerWords(text: string): number {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "gi");
    return count + (lower.match(regex) || []).length;
  }, 0);
}

const analyzeSchema = z.object({
  questionText: z.string().min(1),
  answerText: z.string().min(1),
  role: z.string().min(1),
  sessionId: z.number().int().optional().nullable(),
  questionId: z.number().int().optional().nullable(),
  company: z.string().optional().nullable(),
  persona: z.string().optional().nullable(),
  resumeText: z.string().optional().nullable(),
});

router.post("/", async (req, res) => {
  const body = analyzeSchema.parse(req.body);
  const fillerWordCount = countFillerWords(body.answerText);

  const personaContext = body.persona === "tough"
    ? "You are a demanding interviewer who sets a very high bar. Be critical and exacting in your evaluation."
    : body.persona === "technical"
    ? "You are a highly technical interviewer focused primarily on depth and precision of technical knowledge."
    : "You are a supportive but professional interviewer who values both technical skills and communication.";

  const companyContext = body.company
    ? `The candidate is interviewing at ${body.company}. Consider ${body.company}'s known culture and expectations in your evaluation.`
    : "";

  const resumeContext = body.resumeText
    ? `Candidate's background from resume:\n${body.resumeText.slice(0, 1000)}\nUse this to contextualize your evaluation.`
    : "";

  const prompt = `${personaContext}
${companyContext}
${resumeContext}

Analyze this interview answer and provide structured feedback.

Role: ${body.role}
Question: ${body.questionText}
Answer: ${body.answerText}
Filler words detected: ${fillerWordCount} (e.g. "um", "uh", "like", "you know")

Evaluate on these dimensions (score each 0-10):
1. Clarity — structure, coherence, ease of understanding
2. Confidence — assertiveness, ownership, decisiveness
3. Technical Depth — relevance and depth of technical knowledge
4. Communication — language, storytelling, conciseness

Also evaluate:
5. STAR Score (0-10) — does the answer follow Situation→Task→Action→Result structure? Score 0 if completely absent, 10 if perfectly structured.
6. Tone — single word describing the tone: "confident", "nervous", "enthusiastic", "monotone", "uncertain", or "composed"

Return ONLY valid JSON:
{
  "clarityScore": <0-10>,
  "confidenceScore": <0-10>,
  "technicalDepthScore": <0-10>,
  "communicationScore": <0-10>,
  "overallScore": <average of the 4 main scores>,
  "starScore": <0-10>,
  "toneAnalysis": "<one word>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "improvedAnswer": "<a better version of the answer in 3-5 sentences using STAR structure if applicable>",
  "followUpQuestions": ["<follow-up 1>", "<follow-up 2>", "<follow-up 3>"],
  "feedback": "<2-3 sentence coaching feedback mentioning filler word usage if notable>",
  "starFeedback": "<1 sentence explaining the STAR score and what was missing or done well>"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: "You are an expert interview coach. Always respond with valid JSON only, no markdown." },
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
    starScore: parsed.starScore ?? 5,
    toneAnalysis: parsed.toneAnalysis ?? "neutral",
    fillerWordCount,
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    improvedAnswer: parsed.improvedAnswer ?? "",
    followUpQuestions: parsed.followUpQuestions ?? [],
    feedback: parsed.feedback ?? "",
    starFeedback: parsed.starFeedback ?? "",
  });
});

export default router;
