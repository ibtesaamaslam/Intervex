import { pgTable, serial, text, numeric, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  role: text("role").notNull(),
  company: text("company"),
  resumeText: text("resume_text"),
  persona: text("persona").default("friendly"),
  timedMode: boolean("timed_mode").default(false),
  timePerQuestion: integer("time_per_question").default(120),
  targetDate: timestamp("target_date"),
  drillMode: boolean("drill_mode").default(false),
  status: text("status").notNull().default("active"),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, endedAt: true, overallScore: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
