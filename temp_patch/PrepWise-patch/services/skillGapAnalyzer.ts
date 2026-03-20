/**
 * services/skillGapAnalyzer.ts
 *
 * Compares resume skills vs job description required skills.
 * Produces:
 *  - Matched skills (with proficiency estimate)
 *  - Missing critical skills
 *  - Missing nice-to-have skills
 *  - Gap severity score
 */

import { ParsedResume } from "./resumeParser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export interface SkillGapResult {
  matchedSkills: MatchedSkill[];
  missingCritical: GapSkill[];      // Must-have skills not on resume
  missingNiceToHave: GapSkill[];    // Preferred skills not on resume
  gapScore: number;                 // 0-100: how big is the gap (0 = no gap)
  readinessPercent: number;         // 0-100: how ready is the candidate
  summary: string;
}

export interface MatchedSkill {
  skill: string;
  inResume: boolean;
  proficiencySignals: string;      // e.g. "used in 2 projects, 1 job"
}

export interface GapSkill {
  skill: string;
  importance: "critical" | "preferred";
  learningTime: string;            // e.g. "2-4 weeks"
  suggestedResources: string[];
}

export async function analyzeSkillGap(
  resume: ParsedResume,
  jobDescription: string,
  targetRole: string
): Promise<SkillGapResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const resumeSkills = [
    ...resume.technicalSkills,
    ...resume.domainSkills,
  ].join(", ");

  const prompt = `
You are a senior technical recruiter analyzing a candidate's skill fit for a job.

Candidate's skills: ${resumeSkills}
Candidate's experience summary: ${resume.workExperience.map(w => `${w.role} (${w.durationMonths}mo)`).join(", ")}
Candidate's projects: ${resume.projects.map(p => p.technologiesUsed.join(", ")).join("; ")}

Target Role: ${targetRole}
Job Description:
"""
${jobDescription.slice(0, 3000)}
"""

Return ONLY this JSON structure:
{
  "matchedSkills": [
    { "skill": string, "inResume": true, "proficiencySignals": string }
  ],
  "missingCritical": [
    { "skill": string, "importance": "critical", "learningTime": string, "suggestedResources": string[] }
  ],
  "missingNiceToHave": [
    { "skill": string, "importance": "preferred", "learningTime": string, "suggestedResources": string[] }
  ],
  "gapScore": number,
  "readinessPercent": number,
  "summary": string
}

Rules:
- gapScore: 0 (no gap) to 100 (massive gap)
- readinessPercent: inverse of gapScore, consider experience weight
- learningTime: realistic estimate like "1-2 weeks" or "3-6 months"
- suggestedResources: 2-3 specific resource names (e.g. "freeCodeCamp React course", "Kubernetes official docs")
`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as SkillGapResult;
  } catch {
    return {
      matchedSkills: resume.technicalSkills.map(s => ({ skill: s, inResume: true, proficiencySignals: "Listed in resume" })),
      missingCritical: [],
      missingNiceToHave: [],
      gapScore: 30,
      readinessPercent: 70,
      summary: "Skill gap analysis completed with limited context.",
    };
  }
}
