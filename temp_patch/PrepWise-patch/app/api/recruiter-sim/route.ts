// ============================================================
// app/api/recruiter-sim/route.ts
// Recruiter Simulation — AI predicts shortlist decision + reasoning
// NEW: Did not exist before
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedResume, ATSScore, RecruiterSimulation } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.2,
    responseMimeType: "application/json",
  },
});

function buildRecruiterPrompt(
  resume: ParsedResume,
  atsScore: ATSScore,
  jobDescription: string,
  targetRole: string,
  companyType: string
): string {
  const expSummary = resume.experience
    .map((e) => `${e.title} @ ${e.company} (${e.duration}): ${e.description.slice(0, 2).join(". ")}`)
    .join("\n");

  const skillsSummary = [
    ...resume.skills.technical,
    ...resume.skills.tools,
  ].join(", ");

  return `
You are an experienced technical recruiter at a ${companyType || "mid-size tech company"} with 10+ years of hiring experience.

You are reviewing a candidate for the role of: ${targetRole}

CANDIDATE RESUME SUMMARY:
Name: ${resume.name || "Candidate"}
Education: ${resume.education.map((e) => `${e.degree} - ${e.institution} (${e.year})`).join("; ") || "Not specified"}
Experience:
${expSummary || "No experience listed"}
Key Skills: ${skillsSummary || "No skills listed"}
Projects: ${resume.projects.map((p) => `${p.name} (${p.techStack.join(", ")})`).join("; ") || "None"}
Certifications: ${resume.certifications.join(", ") || "None"}
Summary: ${resume.summary || "No summary provided"}

ATS ANALYSIS:
Overall ATS Score: ${atsScore.overall}/100
JD Match: ${atsScore.jdMatchPercentage}%
Passes ATS Filter: ${atsScore.passesATS}
Critical Issues: ${atsScore.criticalIssues.join("; ")}

JOB DESCRIPTION:
${jobDescription || `Standard ${targetRole} position at a tech company.`}

As a recruiter, make a hiring decision. Think about:
1. First impression (would you keep reading after 6 seconds?)
2. Does the experience align with the role level?
3. Are there red flags (employment gaps, irrelevant experience)?
4. Does the skills section match what we need?
5. Are achievements quantified and impactful?

Return ONLY this JSON:
{
  "shortlistProbability": 0,
  "decision": "Strong Yes | Yes | Maybe | No | Strong No",
  "reasoning": "2–3 sentences explaining your decision as a recruiter thinking out loud",
  "strengths": ["2–4 specific strengths that stand out to you"],
  "redFlags": ["1–3 red flags or concerns, be honest"],
  "firstImpressionScore": 0,
  "recruiterNotes": "Informal 1–2 sentence note you'd write to the hiring manager",
  "improveToGetShortlisted": ["3–4 specific changes that would flip your decision to Yes"]
}

shortlistProbability: 0–100 (what % chance you'd shortlist this person)
firstImpressionScore: 0–100 (based on first 6-second scan)
`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      resume,
      atsScore,
      jobDescription = "",
      targetRole = "Software Engineer",
      companyType = "mid-size tech company",
    } = await req.json() as {
      resume: ParsedResume;
      atsScore: ATSScore;
      jobDescription: string;
      targetRole: string;
      companyType: string;
    };

    if (!resume || !atsScore) {
      return NextResponse.json(
        { error: "resume and atsScore required" },
        { status: 400 }
      );
    }

    const prompt = buildRecruiterPrompt(
      resume,
      atsScore,
      jobDescription,
      targetRole,
      companyType
    );

    const result = await model.generateContent(prompt);
    let text = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const simulation: RecruiterSimulation = JSON.parse(text);

    // Clamp values
    simulation.shortlistProbability = Math.max(
      0,
      Math.min(100, simulation.shortlistProbability)
    );
    simulation.firstImpressionScore = Math.max(
      0,
      Math.min(100, simulation.firstImpressionScore)
    );

    return NextResponse.json({ success: true, simulation });
  } catch (error: unknown) {
    console.error("recruiter-sim error:", error);
    return NextResponse.json(
      { error: "Recruiter simulation failed", details: String(error) },
      { status: 500 }
    );
  }
}
