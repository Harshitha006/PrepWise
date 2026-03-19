// ============================================================
// app/api/generate-interview/route.ts  (ENHANCED — replaces existing)
// Resume-aware interview question generator
// Previously: generic questions. Now: tailored to candidate's
// actual resume, skill gaps, and target role.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedResume } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,       // Varied questions
    responseMimeType: "application/json",
  },
});

interface InterviewQuestion {
  id: string;
  type: "technical" | "behavioral" | "situational" | "resume-based";
  category: string;
  question: string;
  followUp: string;
  evaluationCriteria: string[];
  difficulty: "easy" | "medium" | "hard";
  expectedDuration: number; // seconds
}

function buildQuestionPrompt(
  resume: ParsedResume | null,
  targetRole: string,
  experience: string,
  focusAreas: string[],
  questionCount: number,
  missingSkills: string[]
): string {
  const candidateContext = resume
    ? `
CANDIDATE PROFILE:
- Name: ${resume.name}
- Skills: ${[...resume.skills.technical, ...resume.skills.tools].join(", ")}
- Experience: ${resume.experience.map((e) => `${e.title} at ${e.company}`).join("; ")}
- Projects: ${resume.projects.map((p) => `${p.name} (${p.techStack.join(", ")})`).join("; ")}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}
`
    : "CANDIDATE PROFILE: Not available — generate general questions for the role.";

  return `
You are a senior technical interviewer at a top tech company. Generate a tailored interview question set.

${candidateContext}

TARGET ROLE: ${targetRole}
EXPERIENCE LEVEL: ${experience}
FOCUS AREAS: ${focusAreas.join(", ") || "general"}
SKILLS TO PROBE (candidate claimed these, verify depth): ${resume?.skills.technical.slice(0, 5).join(", ") || "General programming"}
SKILL GAPS TO EXPLORE (weaknesses identified): ${missingSkills.join(", ") || "None specified"}

Generate exactly ${questionCount} interview questions. Mix these types:
- 40% technical (test actual knowledge of their claimed skills)
- 25% behavioral (STAR-format situations from their experience)
- 20% resume-based (probe specific projects/decisions they made)
- 15% situational (hypothetical role scenarios)

For behavioral/resume questions, reference SPECIFIC items from their resume (project names, companies, technologies).

Return ONLY this JSON array:
[
  {
    "id": "q1",
    "type": "technical | behavioral | situational | resume-based",
    "category": "e.g., React, Problem Solving, Leadership, System Design",
    "question": "The actual interview question",
    "followUp": "A natural follow-up question to dig deeper",
    "evaluationCriteria": ["what a strong answer includes", "another criterion"],
    "difficulty": "easy | medium | hard",
    "expectedDuration": 120
  }
]

Rules:
- Make questions specific, not generic ("Tell me about a time you optimized a React component for performance" not "Tell me about optimization")
- For resume-based questions, mention the actual project/company from their resume
- evaluationCriteria should help the AI evaluate the candidate's answer
- expectedDuration in seconds (easy: 60-90, medium: 90-180, hard: 180-300)
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resume,
      targetRole = "Software Engineer",
      experience = "mid-level",
      focusAreas = [],
      questionCount = 10,
      missingSkills = [],
    }: {
      resume: ParsedResume | null;
      targetRole: string;
      experience: string;
      focusAreas: string[];
      questionCount: number;
      missingSkills: string[];
    } = body;

    const prompt = buildQuestionPrompt(
      resume,
      targetRole,
      experience,
      focusAreas,
      Math.min(questionCount, 15),
      missingSkills
    );

    const result = await model.generateContent(prompt);
    let text = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const questions: InterviewQuestion[] = JSON.parse(text);

    return NextResponse.json({
      success: true,
      questions,
      meta: {
        targetRole,
        experience,
        questionCount: questions.length,
        resumeAware: !!resume,
      },
    });
  } catch (error: unknown) {
    console.error("generate-interview error:", error);
    return NextResponse.json(
      { error: "Interview generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
