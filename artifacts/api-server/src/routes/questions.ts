import { Router, type IRouter } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { category, difficulty } = req.query as { category?: string; difficulty?: string };
  let query = db.select().from(questionsTable);
  const questions = await query;
  const filtered = questions.filter(q => {
    if (category && q.category !== category) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
  res.json(filtered.map(q => ({
    id: q.id,
    text: q.text,
    category: q.category,
    difficulty: q.difficulty,
    followUps: q.followUps || [],
  })));
});

export default router;
