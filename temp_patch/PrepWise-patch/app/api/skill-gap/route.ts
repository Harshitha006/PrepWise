// ============================================================
// app/api/skill-gap/route.ts
// Skill Gap Detection — resume skills vs JD required skills
// NEW: Did not exist before
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedResume, SkillGap } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.15,
    responseMimeType: "application/json",
  },
});

function buildSkillGapPrompt(
  resume: ParsedResume,
  jobDescription: string,
  targetRole: string
): string {
  const allSkills = [
    ...resume.skills.technical,
    ...resume.skills.tools,
    ...resume.skills.languages,
    ...resume.skills.soft,
  ];

  // Also extract skills mentioned in projects/experience
  const impliedSkills = [
    ...resume.projects.flatMap((p) => p.techStack),
    ...resume.experience.flatMap((e) => e.description.join(" ").match(/\b[A-Z][a-zA-Z.#+]+\b/g) ?? []),
  ];

  const allCandidateSkills = [...new Set([...allSkills, ...impliedSkills])];

  return `
You are a technical hiring specialist. Analyze the candidate's skills vs the job requirements.

CANDIDATE SKILLS (from resume):
${allCandidateSkills.join(", ")}

CANDIDATE EXPERIENCE CONTEXT:
${resume.experience.map((e) => `${e.title}: ${e.description.slice(0, 2).join(". ")}`).join("\n")}

TARGET ROLE: ${targetRole}

JOB DESCRIPTION / REQUIRED SKILLS:
${jobDescription || `Standard ${targetRole} position. Use typical industry skill requirements for this role.`}

Perform a thorough skill gap analysis. Return ONLY this JSON:
{
  "presentSkills": ["skills the candidate has that match the JD"],
  "missingSkills": ["skills required by JD that candidate clearly lacks"],
  "partialSkills": [
    { "skill": "skill name", "gap": "what specific aspect they lack (e.g., 'knows React basics but no advanced hooks/state management')" }
  ],
  "prioritySkillsToLearn": ["top 5 skills to learn first, in priority order"],
  "overallMatchScore": 0
}

Rules:
- Be specific (e.g., "React.js" not just "frontend")
- partialSkills = candidate knows the technology but not at required depth
- prioritySkillsToLearn = most impactful skills to acquire for this specific role
- overallMatchScore = 0–100 (% of JD requirements the candidate meets)
`;
}

export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription, targetRole } = await req.json() as {
      resume: ParsedResume;
      jobDescription: string;
      targetRole: string;
    };

    if (!resume) {
      return NextResponse.json({ error: "Resume required" }, { status: 400 });
    }

    const prompt = buildSkillGapPrompt(resume, jobDescription, targetRole);
    const result = await model.generateContent(prompt);
    let text = result.response.text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const skillGap: SkillGap = JSON.parse(text);

    return NextResponse.json({ success: true, skillGap });
  } catch (error: unknown) {
    console.error("skill-gap error:", error);
    return NextResponse.json(
      { error: "Skill gap analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}
