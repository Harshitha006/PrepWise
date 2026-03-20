// ============================================================
// app/api/ats-score/route.ts  — FIXED
//
// BUGS FIXED:
// 1. No-JD mode hallucination — now uses a role-quality prompt
//    instead of asking Gemini to guess against a generic JD
// 2. Fallback defaults changed from 50 → 0 (honest, not flattering)
// 3. scoreQuantifiedAchievements regex tightened — needs actual number
// 4. scoreSectionCompleteness — certs/achievements no longer penalise
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedResume, ATSScore } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: { temperature: 0.1 },
});

// ── Deterministic scorers ─────────────────────────────────────

function scoreActionVerbs(resume: ParsedResume): number {
  const strongVerbs = [
    "developed","built","designed","implemented","architected","led","managed",
    "created","deployed","optimized","reduced","increased","improved","launched",
    "delivered","collaborated","mentored","automated","integrated","migrated",
    "refactored","scaled","engineered","established","spearheaded","streamlined",
    "achieved","generated","coordinated","analyzed","resolved","drove","owned",
    "shipped","maintained","monitored","debugged","tested","documented",
  ];
  const allText = [
    ...resume.experience.flatMap((e) => e.description),
    ...resume.achievements,
  ].join(" ").toLowerCase();

  const found = new Set(strongVerbs.filter((v) => allText.includes(v)));
  return Math.min(100, Math.round((found.size / 5) * 100));
}

function scoreQuantifiedAchievements(resume: ParsedResume): number {
  const bullets = [
    ...resume.experience.flatMap((e) => e.description),
    ...resume.achievements,
  ];
  if (bullets.length === 0) return 0;

  // FIX: Must have a number near the metric — not just the keyword alone
  const quantifiedRegex =
    /\d+\s*(%|x\b|k\b|ms\b|s\b|hours?|days?|weeks?|months?|users?|customers?|requests?|million|thousand)|\b(reduced|increased|improved|decreased|saved|generated|grew)\s+\w+\s+by\s+\d+|\d+\+?\s*(features?|bugs?|issues?|projects?|clients?|engineers?|teams?)/gi;

  const quantified = bullets.filter((b) => quantifiedRegex.test(b));
  return Math.min(100, Math.round((quantified.length / bullets.length) * 200));
}

function scoreSectionCompleteness(resume: ParsedResume): number {
  // FIX: Only core sections penalise. Bonus sections add points.
  const core = [
    !!(resume.name && resume.email),
    resume.skills.technical.length > 0,
    resume.experience.length > 0,
    resume.education.length > 0,
  ];
  const bonus = [
    !!(resume.summary && resume.summary.length > 30),
    resume.projects.length > 0,
  ];
  const coreRatio  = core.filter(Boolean).length  / core.length;
  const bonusRatio = bonus.filter(Boolean).length / bonus.length;
  return Math.round(coreRatio * 80 + bonusRatio * 20);
}

function scoreReadability(resume: ParsedResume): number {
  let score = 100;
  if (!resume.name)  score -= 25;
  if (!resume.email) score -= 20;
  const bullets = resume.experience.flatMap((e) => e.description);
  if (resume.experience.length > 0 && bullets.length < resume.experience.length) score -= 20;
  if (bullets.some((b) => b.split(" ").length > 50)) score -= 15;
  return Math.max(0, score);
}

function scoreLengthAppropriateness(resume: ParsedResume): number {
  const bullets = resume.experience.flatMap((e) => e.description).length;
  const sections =
    (resume.skills.technical.length > 0 ? 1 : 0) +
    (resume.experience.length > 0 ? 1 : 0) +
    (resume.education.length > 0 ? 1 : 0) +
    (resume.projects.length > 0 ? 1 : 0);
  if (sections < 3)    return 20;
  if (bullets < 3)     return 30;
  if (bullets <= 25)   return 100;
  if (bullets <= 35)   return 75;
  return 55;
}

// ── AI prompts ────────────────────────────────────────────────

function buildJDPrompt(resume: ParsedResume, jd: string, role: string): string {
  return `You are a strict ATS scoring engine. Score this resume against the job description honestly.
Do NOT be generous. Missing skills = low score.

RESUME SKILLS: ${[...resume.skills.technical, ...resume.skills.tools].join(", ") || "None"}
EXPERIENCE: ${resume.experience.map((e) => `${e.title} at ${e.company}`).join("; ") || "None"}
PROJECTS: ${resume.projects.map((p) => `${p.name} (${p.techStack.join(", ")})`).join("; ") || "None"}
EDUCATION: ${resume.education.map((e) => e.degree).join(", ") || "None"}
CERTS: ${resume.certifications.join(", ") || "None"}
TARGET ROLE: ${role}

JOB DESCRIPTION:
${jd}

Return ONLY valid JSON (no markdown, no explanation):
{"keywordMatch":0,"relevance":0,"skillsCoverage":0,"experienceMatch":0,"educationMatch":0,"jdMatchPercentage":0,"passesATS":false,"criticalIssues":[],"suggestions":[]}`;
}

function buildNoJDPrompt(resume: ParsedResume, role: string): string {
  const bullets = resume.experience.flatMap((e) => e.description).slice(0, 10).join(" | ");
  return `You are a strict resume quality reviewer. Rate this resume for a ${role} role against typical industry standards.
Be honest — do not inflate scores.

SKILLS: ${[...resume.skills.technical, ...resume.skills.tools].join(", ") || "None listed"}
EXPERIENCE BULLETS: ${bullets || "None"}
ROLES: ${resume.experience.map((e) => e.title).join(", ") || "None"}
PROJECTS: ${resume.projects.map((p) => p.name).join(", ") || "None"}

Return ONLY valid JSON (no markdown):
{"keywordMatch":0,"relevance":0,"skillsCoverage":0,"experienceMatch":0,"educationMatch":0,"jdMatchPercentage":0,"passesATS":false,"criticalIssues":[],"suggestions":[]}`;
}

// ── POST handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription = "", targetRole = "Software Engineer" } =
      await req.json() as { resume: ParsedResume; jobDescription: string; targetRole: string };

    if (!resume) return NextResponse.json({ error: "Resume data required" }, { status: 400 });

    // Deterministic
    const actionVerbScore      = scoreActionVerbs(resume);
    const quantifiedScore      = scoreQuantifiedAchievements(resume);
    const sectionScore         = scoreSectionCompleteness(resume);
    const readabilityScore     = scoreReadability(resume);
    const lengthScore          = scoreLengthAppropriateness(resume);

    // AI scoring
    const hasJD = jobDescription.trim().length > 50;
    const prompt = hasJD
      ? buildJDPrompt(resume, jobDescription, targetRole)
      : buildNoJDPrompt(resume, targetRole);

    const result = await model.generateContent(prompt);
    let raw = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // FIX: Honest fallback — 0 not 50
    let ai: Record<string, unknown> = {
      keywordMatch: 0, relevance: 0, skillsCoverage: 0,
      experienceMatch: 0, educationMatch: 0, jdMatchPercentage: 0,
      passesATS: false, criticalIssues: [], suggestions: [],
    };
    try { ai = JSON.parse(raw); }
    catch { console.error("Gemini JSON parse failed:", raw.slice(0, 200)); }

    const clamp = (v: unknown) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)));

    const breakdown = {
      keywordMatch:           clamp(ai.keywordMatch),
      sectionCompleteness:    sectionScore,
      quantifiedAchievements: quantifiedScore,
      actionVerbs:            actionVerbScore,
      readability:            readabilityScore,
      relevance:              clamp(ai.relevance),
      skillsCoverage:         clamp(ai.skillsCoverage),
      experienceMatch:        clamp(ai.experienceMatch),
      educationMatch:         clamp(ai.educationMatch),
      lengthAppropriate:      lengthScore,
    };

    const weights: Record<string, number> = {
      keywordMatch: 0.20, sectionCompleteness: 0.10, quantifiedAchievements: 0.10,
      actionVerbs: 0.08, readability: 0.07, relevance: 0.15,
      skillsCoverage: 0.12, experienceMatch: 0.10, educationMatch: 0.05,
      lengthAppropriate: 0.03,
    };

    const overall = Math.round(
      Object.entries(breakdown).reduce((sum, [k, v]) => sum + v * (weights[k] ?? 0), 0)
    );

    const atsScore: ATSScore = {
      overall,
      breakdown,
      passesATS: Boolean(ai.passesATS) || overall >= 60,
      criticalIssues: Array.isArray(ai.criticalIssues) ? ai.criticalIssues as string[] : [],
      suggestions:    Array.isArray(ai.suggestions)    ? ai.suggestions    as string[] : [],
      jdMatchPercentage: clamp(ai.jdMatchPercentage),
    };

    return NextResponse.json({ success: true, atsScore, hasJD });
  } catch (error: unknown) {
    console.error("ats-score error:", error);
    return NextResponse.json(
      { error: "ATS scoring failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
