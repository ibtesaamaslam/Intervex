import { pgTable, serial, integer, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions";
import { questionsTable } from "./questions";

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questionsTable.id, { onDelete: "set null" }),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text").notNull(),
  clarityScore: numeric("clarity_score", { precision: 5, scale: 2 }),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  technicalDepthScore: numeric("technical_depth_score", { precision: 5, scale: 2 }),
  communicationScore: numeric("communication_score", { precision: 5, scale: 2 }),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  starScore: numeric("star_score", { precision: 5, scale: 2 }),
  fillerWordCount: integer("filler_word_count").default(0),
  toneAnalysis: text("tone_analysis"),
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  improvedAnswer: text("improved_answer"),
  followUpQuestions: jsonb("follow_up_questions").$type<string[]>(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, createdAt: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;
