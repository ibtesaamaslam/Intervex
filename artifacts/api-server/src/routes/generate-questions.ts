import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod/v4";

const router: IRouter = Router();

const generateSchema = z.object({
  role: z.string().min(1),
  company: z.string().optional().nullable(),
  persona: z.enum(["friendly", "tough", "technical"]).optional().default("friendly"),
  resumeText: z.string().optional().nullable(),
  drillCategory: z.string().optional().nullable(),
  count: z.number().int().min(5).max(20).optional().default(10),
});

router.post("/", async (req, res) => {
  const body = generateSchema.parse(req.body);

  const personaStyle = body.persona === "tough"
    ? "hard-hitting, probing questions that challenge the candidate's claims and push for specifics"
    : body.persona === "technical"
    ? "deep technical questions testing implementation knowledge, system design, and algorithmic thinking"
    : "balanced mix of behavioral and technical questions appropriate for the role";

  const companyFocus = body.company
    ? `This is for a ${body.company} interview. Include questions reflecting ${body.company}'s known culture (e.g., leadership principles for Amazon, product sense for Google, etc.).`
    : "";

  const resumeFocus = body.resumeText
    ? `Tailor questions based on this candidate's resume:\n${body.resumeText.slice(0, 2500)}\n\nIMPORTANT: Ask about specific projects, tools, companies, technologies, and accomplishments mentioned in the resume. At least half the questions should reference something from the resume directly (e.g. "I see you worked on X at Y — tell me about..."). Make questions feel personalized and targeted, not generic.`
    : "";

  const drillFocus = body.drillCategory
    ? `Focus exclusively on the "${body.drillCategory}" weakness area the candidate needs to practice most.`
    : "";

  const prompt = `Generate ${body.count} interview questions for a ${body.role} role.
Style: ${personaStyle}
${companyFocus}
${resumeFocus}
${drillFocus}

Return ONLY valid JSON:
{
  "questions": [
    {
      "text": "<question text>",
      "category": "<one of: behavioral, technical, system-design, leadership, product, culture-fit>",
      "difficulty": "<easy|medium|hard>",
      "followUps": ["<follow-up 1>", "<follow-up 2>"]
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: "You are an expert interviewer. Return valid JSON only, no markdown." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  res.json({ questions: parsed.questions ?? [] });
});

export default router;
