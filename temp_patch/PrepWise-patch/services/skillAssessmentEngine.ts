/**
 * services/skillAssessmentEngine.ts
 *
 * Generates adaptive mini-tests (MCQ + short-answer) per skill.
 * Evaluates answers and returns validated proficiency level.
 *
 * Difficulty adapts:
 *  - Start at medium
 *  - Correct → increase difficulty
 *  - Wrong → decrease difficulty (but track)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// ─── Types ────────────────────────────────────────────────────────────────────

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type QuestionType = "mcq" | "short_answer" | "code_snippet";

export interface AssessmentQuestion {
  id: string;
  skill: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options?: string[];          // for MCQ
  correctAnswer: string;
  explanation: string;
  timeLimit: number;           // seconds
}

export interface AssessmentAnswer {
  questionId: string;
  userAnswer: string;
  timeTakenSeconds: number;
}

export interface QuestionEvaluation {
  questionId: string;
  isCorrect: boolean;
  score: number;               // 0-10
  feedback: string;
  correctAnswer: string;
  explanation: string;
}

export interface SkillAssessmentResult {
  skill: string;
  proficiencyLevel: "novice" | "beginner" | "intermediate" | "advanced" | "expert";
  validatedScore: number;      // 0-100
  questionsAttempted: number;
  correctCount: number;
  evaluations: QuestionEvaluation[];
  claimVerified: boolean;      // did candidate prove they know this skill?
  recommendation: string;
}

// ─── Generate Questions ────────────────────────────────────────────────────────

export async function generateSkillQuestions(
  skill: string,
  difficulty: Difficulty = "intermediate",
  count: number = 5
): Promise<AssessmentQuestion[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });

  const prompt = `
Generate ${count} assessment questions to validate a candidate's knowledge of "${skill}".

Difficulty level: ${difficulty}
Mix of question types: mostly MCQ, 1 short_answer.

Return ONLY a JSON array:
[
  {
    "id": "q1",
    "skill": "${skill}",
    "type": "mcq" | "short_answer",
    "difficulty": "${difficulty}",
    "question": string,
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],  // only for MCQ
    "correctAnswer": string,  // for MCQ: the full option text; for short_answer: model answer
    "explanation": string,    // why this is the correct answer
    "timeLimit": number       // seconds, e.g. 60 for MCQ, 180 for short_answer
  }
]

Rules:
- Questions should be PRACTICAL and test real understanding, not trivia.
- For ${difficulty} level:
  ${difficulty === "beginner" ? "Focus on fundamentals, syntax, basic concepts." : ""}
  ${difficulty === "intermediate" ? "Focus on application, common patterns, trade-offs." : ""}
  ${difficulty === "advanced" ? "Focus on performance, architecture, edge cases, internals." : ""}
- Make distractors (wrong options) plausible but clearly incorrect on reflection.
- Keep questions concise, max 3 sentences.
`;

  try {
    const result = await model.generateContent(prompt);
    const questions = JSON.parse(result.response.text()) as AssessmentQuestion[];
    return questions.map((q, i) => ({ ...q, id: `${skill}-${difficulty}-${i}` }));
  } catch {
    return getGenericFallbackQuestions(skill, difficulty);
  }
}

// ─── Evaluate Answers ─────────────────────────────────────────────────────────

export async function evaluateAnswers(
  questions: AssessmentQuestion[],
  answers: AssessmentAnswer[]
): Promise<QuestionEvaluation[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  });

  const qaPairs = questions.map((q) => {
    const ans = answers.find((a) => a.questionId === q.id);
    return { question: q, userAnswer: ans?.userAnswer ?? "(no answer)" };
  });

  const prompt = `
Evaluate these assessment answers and return a JSON array of evaluations.

${JSON.stringify(qaPairs.map(({ question, userAnswer }) => ({
  id: question.id,
  type: question.type,
  question: question.question,
  correctAnswer: question.correctAnswer,
  explanation: question.explanation,
  userAnswer,
})))}

Return ONLY:
[
  {
    "questionId": string,
    "isCorrect": boolean,
    "score": number,     // 0-10
    "feedback": string,  // 1-2 sentences explaining what was right/wrong
    "correctAnswer": string,
    "explanation": string
  }
]

For MCQ: isCorrect if userAnswer matches or contains the correct option.
For short_answer: partial credit allowed; evaluate conceptual understanding.
`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as QuestionEvaluation[];
  } catch {
    // Simple fallback for MCQ
    return questions.map((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      const isCorrect = q.type === "mcq"
        ? (ans?.userAnswer ?? "").toLowerCase().includes(q.correctAnswer.toLowerCase().charAt(0))
        : false;
      return {
        questionId: q.id,
        isCorrect,
        score: isCorrect ? 7 : 0,
        feedback: isCorrect ? "Correct!" : "Incorrect.",
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });
  }
}

// ─── Compute Final Result ──────────────────────────────────────────────────────

export function computeSkillResult(
  skill: string,
  questions: AssessmentQuestion[],
  evaluations: QuestionEvaluation[]
): SkillAssessmentResult {
  const correctCount = evaluations.filter((e) => e.isCorrect).length;
  const totalScore = evaluations.reduce((s, e) => s + e.score, 0);
  const maxScore = questions.length * 10;
  const validatedScore = Math.round((totalScore / maxScore) * 100);

  const level = scoreToProficiency(validatedScore);
  const claimVerified = validatedScore >= 60;

  return {
    skill,
    proficiencyLevel: level,
    validatedScore,
    questionsAttempted: questions.length,
    correctCount,
    evaluations,
    claimVerified,
    recommendation: claimVerified
      ? `Your ${skill} knowledge is validated at ${level} level. Consider showcasing this more prominently.`
      : `Your ${skill} score (${validatedScore}%) suggests gaps. Review ${getStudyResource(skill)} before claiming this skill.`,
  };
}

// ─── Adaptive Question Set ─────────────────────────────────────────────────────

export async function runAdaptiveAssessment(
  skill: string,
  totalQuestions: number = 7
): Promise<AssessmentQuestion[]> {
  // Generate questions at all 3 levels, then serve adaptively
  const [beginner, intermediate, advanced] = await Promise.all([
    generateSkillQuestions(skill, "beginner", 2),
    generateSkillQuestions(skill, "intermediate", 3),
    generateSkillQuestions(skill, "advanced", 2),
  ]);

  // Start with intermediate, bookended by beginner/advanced
  return [...intermediate.slice(0, 2), ...beginner, ...intermediate.slice(2), ...advanced].slice(0, totalQuestions);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToProficiency(score: number): SkillAssessmentResult["proficiencyLevel"] {
  if (score >= 90) return "expert";
  if (score >= 75) return "advanced";
  if (score >= 55) return "intermediate";
  if (score >= 35) return "beginner";
  return "novice";
}

function getStudyResource(skill: string): string {
  const resources: Record<string, string> = {
    "React": "the official React docs and build a small project",
    "Python": "Python.org tutorials and practice on LeetCode",
    "TypeScript": "the TypeScript Handbook at typescriptlang.org",
    "Node.js": "Node.js official guides and build a REST API",
    "AWS": "AWS Skill Builder free courses",
    "Docker": "Docker's official 'Getting Started' guide",
    "Machine Learning": "fast.ai Practical Deep Learning course",
  };
  return resources[skill] ?? `dedicated ${skill} learning resources`;
}

function getGenericFallbackQuestions(skill: string, difficulty: Difficulty): AssessmentQuestion[] {
  return [
    {
      id: `${skill}-fallback-0`,
      skill,
      type: "short_answer",
      difficulty,
      question: `Explain what ${skill} is and describe one practical use case where you've applied it or would apply it.`,
      correctAnswer: `A clear, accurate explanation of ${skill} with a realistic use case.`,
      explanation: `This tests both conceptual understanding and practical experience with ${skill}.`,
      timeLimit: 180,
    },
  ];
}
