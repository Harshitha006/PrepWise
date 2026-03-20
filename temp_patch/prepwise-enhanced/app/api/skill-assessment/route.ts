// ============================================================
// app/api/skill-assessment/route.ts
// Adaptive Skill Assessment Engine — mini-tests to verify claimed skills
// NEW: Did not exist before
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssessmentQuestion, AssessmentResult } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3, // Slight variation for question variety
    responseMimeType: "application/json",
  },
});

// ── Generate questions for a skill ──────────────────────────
async function generateQuestions(
  skill: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  count: number = 5
): Promise<AssessmentQuestion[]> {
  const prompt = `
You are a senior technical interviewer. Generate exactly ${count} multiple-choice questions to test a candidate's knowledge of "${skill}" at ${difficulty} level.

Rules:
- Questions must be practical and relevant to real work scenarios
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option is correct
- Explanation must clearly explain WHY the correct answer is right
- Difficulty: ${difficulty === "beginner" ? "fundamentals, basic syntax/concepts" : difficulty === "intermediate" ? "real-world usage, common patterns, debugging" : "advanced internals, optimization, edge cases, architecture"}
- Make questions that a hiring manager would actually ask

Return ONLY this JSON array:
[
  {
    "id": "q1",
    "skill": "${skill}",
    "difficulty": "${difficulty}",
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this is correct and why others are wrong"
  }
]
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text()
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(text);
}

// ── Evaluate a completed assessment ─────────────────────────
async function evaluateAssessment(
  skill: string,
  questions: AssessmentQuestion[],
  answers: number[]
): Promise<AssessmentResult> {
  const correct = answers.filter(
    (ans, i) => ans === questions[i]?.correctIndex
  ).length;
  const total = questions.length;
  const score = Math.round((correct / total) * 100);

  // Determine level based on score
  let level: AssessmentResult["level"];
  if (score >= 90) level = "expert";
  else if (score >= 70) level = "advanced";
  else if (score >= 50) level = "intermediate";
  else level = "beginner";

  return {
    skill,
    score,
    level,
    verified: score >= 70,
    questionsAttempted: total,
    correctAnswers: correct,
  };
}

// ── POST: Generate questions ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, skill, difficulty, count, questions, answers } = body;

    if (action === "generate") {
      // Generate assessment questions for a skill
      if (!skill) {
        return NextResponse.json(
          { error: "skill required" },
          { status: 400 }
        );
      }

      const questionDifficulty: "beginner" | "intermediate" | "advanced" =
        difficulty || "intermediate";
      const questionCount = Math.min(count || 5, 10); // Max 10 questions

      const generatedQuestions = await generateQuestions(
        skill,
        questionDifficulty,
        questionCount
      );

      return NextResponse.json({
        success: true,
        questions: generatedQuestions,
        skill,
        difficulty: questionDifficulty,
      });
    }

    if (action === "evaluate") {
      // Evaluate submitted answers
      if (!questions || !answers || !skill) {
        return NextResponse.json(
          { error: "questions, answers, and skill required for evaluation" },
          { status: 400 }
        );
      }

      const result = await evaluateAssessment(skill, questions, answers);

      return NextResponse.json({ success: true, result });
    }

    // Generate assessments for multiple skills at once
    if (action === "generate-batch") {
      const { skills }: { skills: string[] } = body;
      if (!skills || skills.length === 0) {
        return NextResponse.json(
          { error: "skills array required" },
          { status: 400 }
        );
      }

      // Limit to 5 skills for batch generation
      const skillsToTest = skills.slice(0, 5);
      const batchResults = await Promise.all(
        skillsToTest.map((s) =>
          generateQuestions(s, "intermediate", 4).then((qs) => ({
            skill: s,
            questions: qs,
          }))
        )
      );

      return NextResponse.json({ success: true, assessments: batchResults });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("skill-assessment error:", error);
    return NextResponse.json(
      { error: "Assessment generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
