// ============================================================
// app/api/interview-feedback/route.ts  (ENHANCED — replaces/upgrades existing)
// Detailed per-answer feedback + overall interview analysis
// Tailored to candidate's resume and target role
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedResume } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.2,
    responseMimeType: "application/json",
  },
});

interface AnswerFeedback {
  questionId: string;
  question: string;
  answer: string;
  score: number;           // 0–100
  strengths: string[];
  improvements: string[];
  idealAnswerHints: string[];
  communicationScore: number;
  technicalAccuracy: number;
  relevance: number;
}

interface InterviewFeedback {
  overallScore: number;
  scores: {
    technicalKnowledge: number;
    communication: number;
    problemSolving: number;
    culturalFit: number;
    confidence: number;
    resumeConsistency: number; // NEW: are answers consistent with resume claims?
  };
  summary: string;
  topStrengths: string[];
  criticalWeaknesses: string[];
  hiringRecommendation: string;
  answerFeedback: AnswerFeedback[];
  nextSteps: string[];
  practiceTopics: string[];
}

function buildFeedbackPrompt(
  resume: ParsedResume | null,
  targetRole: string,
  transcript: { questionId: string; question: string; answer: string; evaluationCriteria: string[] }[]
): string {
  const candidateContext = resume
    ? `CANDIDATE RESUME: ${resume.name} | Skills: ${resume.skills.technical.slice(0, 8).join(", ")} | Experience: ${resume.experience.map((e) => e.title).join(", ")}`
    : "CANDIDATE RESUME: Not available";

  const transcriptText = transcript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer || "(No answer given)"}\nCriteria: ${t.evaluationCriteria.join("; ")}`)
    .join("\n\n");

  return `
You are a senior technical interviewer at a top tech company providing detailed, honest, and constructive interview feedback.

${candidateContext}
TARGET ROLE: ${targetRole}

INTERVIEW TRANSCRIPT:
${transcriptText}

Evaluate the candidate rigorously but fairly. Return ONLY this JSON:

{
  "overallScore": 0,
  "scores": {
    "technicalKnowledge": 0,
    "communication": 0,
    "problemSolving": 0,
    "culturalFit": 0,
    "confidence": 0,
    "resumeConsistency": 0
  },
  "summary": "2-3 sentence honest assessment of this candidate for the ${targetRole} role",
  "topStrengths": ["3–4 specific, genuine strengths from their answers"],
  "criticalWeaknesses": ["2–3 honest areas that need improvement"],
  "hiringRecommendation": "Strong Hire | Hire | Maybe | No Hire | Strong No Hire",
  "answerFeedback": [
    {
      "questionId": "q1",
      "question": "question text",
      "answer": "their answer summary",
      "score": 0,
      "strengths": ["what they did well"],
      "improvements": ["specific things to improve"],
      "idealAnswerHints": ["key points a strong answer would include"],
      "communicationScore": 0,
      "technicalAccuracy": 0,
      "relevance": 0
    }
  ],
  "nextSteps": ["3–4 specific action items to improve for next interview"],
  "practiceTopics": ["5–6 topics/skills to study based on weak answers"]
}

Rules:
- Be specific in feedback, not generic ("Your explanation of React's reconciliation algorithm was incomplete — you missed virtual DOM diffing" not "Could improve technical knowledge")
- resumeConsistency: check if their answers match what they claimed on their resume
- hiringRecommendation must match overallScore (80+ = Hire, 60–79 = Maybe, <60 = No Hire)
- Score each answer honestly — empty/irrelevant answers should score < 30
`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      resume,
      targetRole = "Software Engineer",
      transcript,
    }: {
      resume: ParsedResume | null;
      targetRole: string;
      transcript: {
        questionId: string;
        question: string;
        answer: string;
        evaluationCriteria: string[];
      }[];
    } = await req.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "transcript required" },
        { status: 400 }
      );
    }

    const prompt = buildFeedbackPrompt(resume, targetRole, transcript);
    const result = await model.generateContent(prompt);
    let text = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const feedback: InterviewFeedback = JSON.parse(text);

    // Clamp all scores to 0–100
    feedback.overallScore = Math.max(0, Math.min(100, feedback.overallScore));
    for (const key of Object.keys(feedback.scores)) {
      feedback.scores[key as keyof typeof feedback.scores] = Math.max(
        0,
        Math.min(100, feedback.scores[key as keyof typeof feedback.scores])
      );
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error: unknown) {
    console.error("interview-feedback error:", error);
    return NextResponse.json(
      { error: "Feedback generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
