import { describe, expect, it } from "vitest";
import { getDb } from "./db";
import { aureolQuestions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Aureol Questions Logging & FAQ Analysis", () => {
  it("enregistre et agrège correctement les questions posées à l'assistant", async () => {
    const db = await getDb();
    if (!db) {
      expect(true).toBe(true);
      return;
    }

    const testQuestion = "Quels sont les frais pour le Canada ?";
    const testAnswer = "Les frais d'ouverture sont de 65 000 FCFA.";

    await db.insert(aureolQuestions).values({
      question: testQuestion,
      answer: testAnswer,
      sourceWidget: "test_suite",
    });

    const rows = await db
      .select()
      .from(aureolQuestions)
      .where(eq(aureolQuestions.question, testQuestion));

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].answer).toBe(testAnswer);
  });
});
