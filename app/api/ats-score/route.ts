// ============================================================
// app/api/ats-score/route.ts
// Proper ATS Scoring Engine — 10 weighted criteria + JD matching
// Replaces the superficial keyword-count approach
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedResume, ATSScore } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  },
});

// ── Deterministic scoring (no AI needed for these) ───────────

function scoreActionVerbs(resume: ParsedResume): number {
  const strongVerbs = [
    "developed","built","designed","implemented","architected","led","managed",
    "created","deployed","optimized","reduced","increased","improved","launched",
    "delivered","collaborated","mentored","automated","integrated","migrated",
    "refactored","scaled","engineered","established","spearheaded","streamlined",
    "achieved","generated","coordinated","analyzed","resolved","drove","owned",
  ];
  const allDescriptions = [
    ...resume.experience.flatMap((e) => e.description),
    ...resume.achievements,
  ].join(" ").toLowerCase();

  const verbsFound = strongVerbs.filter((v) => allDescriptions.includes(v));
  return Math.min(100, Math.round((verbsFound.length / 10) * 100));
}

function scoreQuantifiedAchievements(resume: ParsedResume): number {
  const allText = [
    ...resume.experience.flatMap((e) => e.description),
    ...resume.achievements,
  ].join(" ");
  // Count sentences/bullets with numbers/percentages/metrics
  const quantifiedPattern = /\d+[\s%$x+]|increased|decreased|reduced|improved by \d|saved \d|\d+ (users|customers|teams|projects|hours|days|months|ms|seconds|million|thousand|k\b)/gi;
  const matches = allText.match(quantifiedPattern) || [];
  const bulletCount = resume.experience.flatMap((e) => e.description).length || 1;
  const ratio = matches.length / bulletCount;
  return Math.min(100, Math.round(ratio * 80 + (matches.length > 3 ? 20 : 0)));
}

function scoreSectionCompleteness(resume: ParsedResume): number {
  const sections = [
    resume.name && resume.email,                    // Contact info
    resume.summary && resume.summary.length > 20,   // Summary/objective
    resume.skills.technical.length > 0,             // Skills
    resume.experience.length > 0,                   // Experience
    resume.education.length > 0,                    // Education
    resume.projects.length > 0,                     // Projects
    resume.certifications.length > 0,               // Certifications (bonus)
    resume.achievements.length > 0,                 // Achievements (bonus)
  ];
  const present = sections.filter(Boolean).length;
  return Math.round((present / sections.length) * 100);
}

function scoreReadability(resume: ParsedResume): number {
  const issues: string[] = [];
  // Check for good bullet usage
  const hasGoodBullets = resume.experience.some((e) => e.description.length >= 2);
  if (!hasGoodBullets) issues.push("sparse bullets");
  // Check for overly long descriptions
  const hasTooLong = resume.experience.some((e) =>
    e.description.some((d) => d.length > 300)
  );
  if (hasTooLong) issues.push("overly long bullets");
  // Check name/contact present
  if (!resume.name) issues.push("no name");
  if (!resume.email) issues.push("no email");

  return Math.max(0, 100 - issues.length * 20);
}

function scoreLengthAppropriateness(resume: ParsedResume): number {
  const experienceYears = resume.experience.length;
  const totalBullets = resume.experience.flatMap((e) => e.description).length;
  const totalSections =
    (resume.skills.technical.length > 0 ? 1 : 0) +
    resume.experience.length +
    resume.education.length +
    resume.projects.length;

  // Heuristic: a resume should have 10–25 meaningful bullets
  if (totalBullets < 3) return 30;
  if (totalBullets >= 5 && totalBullets <= 25 && totalSections >= 3) return 100;
  if (totalBullets > 35) return 60; // Too verbose
  return 80;
}

// ── Build the AI scoring prompt ──────────────────────────────
function buildATSPrompt(
  resume: ParsedResume,
  jobDescription: string,
  targetRole: string
): string {
  const resumeSkills = [
    ...resume.skills.technical,
    ...resume.skills.tools,
    ...resume.skills.languages,
  ].join(", ");

  const experienceSummary = resume.experience
    .map((e) => `${e.title} at ${e.company} (${e.duration})`)
    .join("; ");

  return `
You are an expert ATS (Applicant Tracking System) scoring engine and senior technical recruiter.

Analyze this resume against the job description and return ONLY JSON with the exact schema below.

CANDIDATE PROFILE:
- Name: ${resume.name}
- Skills: ${resumeSkills}
- Experience: ${experienceSummary}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}
- Target Role: ${targetRole}
- Projects: ${resume.projects.map((p) => p.name).join(", ")}
- Certifications: ${resume.certifications.join(", ") || "None"}

JOB DESCRIPTION:
${jobDescription || `Generic ${targetRole} role — score based on standard industry expectations.`}

Score each of these (0–100):
1. keywordMatch: How many JD keywords/technologies appear in the resume? (strict)
2. relevance: Overall relevance of experience/projects to the target role
3. skillsCoverage: % of the JD's required skills the candidate has
4. experienceMatch: Does seniority/years of experience match the JD level?
5. educationMatch: Does the education match the role requirements?
6. jdMatchPercentage: Overall percentage match between resume and JD (0–100)

Also provide:
- passesATS: boolean — would this resume pass initial automated screening? (threshold: keywordMatch > 50 AND overall > 60)
- criticalIssues: array of 2–4 strings — critical problems that would get the resume rejected
- suggestions: array of 3–5 strings — specific, actionable improvements

Return exactly this JSON (numbers only, no units):
{
  "keywordMatch": 0,
  "relevance": 0,
  "skillsCoverage": 0,
  "experienceMatch": 0,
  "educationMatch": 0,
  "jdMatchPercentage": 0,
  "passesATS": false,
  "criticalIssues": [],
  "suggestions": []
}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resume,
      jobDescription = "",
      targetRole = "Software Engineer",
    }: {
      resume: ParsedResume;
      jobDescription: string;
      targetRole: string;
    } = body;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume data required" },
        { status: 400 }
      );
    }

    // ── Deterministic scores (fast, no API calls) ─────────────
    const actionVerbScore = scoreActionVerbs(resume);
    const quantifiedScore = scoreQuantifiedAchievements(resume);
    const sectionScore = scoreSectionCompleteness(resume);
    const readabilityScore = scoreReadability(resume);
    const lengthScore = scoreLengthAppropriateness(resume);

    // ── AI-powered scores (JD-dependent) ─────────────────────
    const prompt = buildATSPrompt(resume, jobDescription, targetRole);
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Strip markdown fences if present
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const aiScores = JSON.parse(responseText);

    // ── Weighted overall score ────────────────────────────────
    // Weights reflect real ATS importance
    const weights = {
      keywordMatch: 0.20,
      sectionCompleteness: 0.10,
      quantifiedAchievements: 0.10,
      actionVerbs: 0.08,
      readability: 0.07,
      relevance: 0.15,
      skillsCoverage: 0.12,
      experienceMatch: 0.10,
      educationMatch: 0.05,
      lengthAppropriate: 0.03,
    };

    const breakdown = {
      keywordMatch: Math.round(aiScores.keywordMatch ?? 50),
      sectionCompleteness: sectionScore,
      quantifiedAchievements: quantifiedScore,
      actionVerbs: actionVerbScore,
      readability: readabilityScore,
      relevance: Math.round(aiScores.relevance ?? 50),
      skillsCoverage: Math.round(aiScores.skillsCoverage ?? 50),
      experienceMatch: Math.round(aiScores.experienceMatch ?? 50),
      educationMatch: Math.round(aiScores.educationMatch ?? 70),
      lengthAppropriate: lengthScore,
    };

    const overall = Math.round(
      Object.entries(breakdown).reduce((sum, [key, val]) => {
        return sum + val * weights[key as keyof typeof weights];
      }, 0)
    );

    const atsScore: ATSScore = {
      overall,
      breakdown,
      passesATS: aiScores.passesATS ?? overall >= 60,
      criticalIssues: aiScores.criticalIssues ?? [],
      suggestions: aiScores.suggestions ?? [],
      jdMatchPercentage: Math.round(aiScores.jdMatchPercentage ?? overall * 0.9),
    };

    return NextResponse.json({ success: true, atsScore });
  } catch (error: unknown) {
    console.error("ats-score error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "ATS scoring failed", details: message },
      { status: 500 }
    );
  }
}
