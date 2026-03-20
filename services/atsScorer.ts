/**
 * services/atsScorer.ts
 *
 * REPLACES naive keyword-count ATS scoring.
 *
 * Scoring dimensions (weighted):
 *  1. Keyword Match         – 30%  (JD skills found in resume)
 *  2. Section Completeness  – 15%  (has summary, education, experience, skills, projects)
 *  3. Quantified Impact     – 15%  (numbers / metrics in bullets)
 *  4. Action Verb Usage     – 10%  (strong verbs starting bullets)
 *  5. Formatting Signals    – 10%  (email, phone, LinkedIn, clean structure)
 *  6. Experience Relevance  – 20%  (role titles & responsibilities match JD context)
 *
 * Each dimension returns 0–100, then weighted sum = final ATS score.
 */

import { ParsedResume } from "./resumeParser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ATSScoreResult {
  overallScore: number;           // 0-100
  grade: "A" | "B" | "C" | "D" | "F";

  dimensions: {
    keywordMatch: DimensionScore;
    sectionCompleteness: DimensionScore;
    quantifiedImpact: DimensionScore;
    actionVerbs: DimensionScore;
    formattingSignals: DimensionScore;
    experienceRelevance: DimensionScore;
  };

  matchedKeywords: string[];
  missingKeywords: string[];
  topImprovements: string[];       // top 3 actionable fixes
}

export interface DimensionScore {
  score: number;                  // 0-100
  weight: number;                 // 0-1
  weightedScore: number;          // score * weight
  feedback: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function computeATSScore(
  resume: ParsedResume,
  jobDescription: string,
  targetRole: string
): Promise<ATSScoreResult> {

  // 1. Keyword Match (uses Gemini to extract JD keywords intelligently)
  const jdKeywords = await extractJDKeywords(jobDescription, targetRole);
  const keywordDim = scoreKeywordMatch(resume, jdKeywords);

  // 2. Section Completeness (rule-based)
  const sectionDim = scoreSectionCompleteness(resume);

  // 3. Quantified Impact (rule-based)
  const impactDim = scoreQuantifiedImpact(resume);

  // 4. Action Verbs (rule-based)
  const verbDim = scoreActionVerbs(resume);

  // 5. Formatting Signals (rule-based)
  const formatDim = scoreFormattingSignals(resume);

  // 6. Experience Relevance (uses Gemini)
  const relevanceDim = await scoreExperienceRelevance(resume, jobDescription, targetRole);

  const overallScore = Math.round(
    keywordDim.weightedScore +
    sectionDim.weightedScore +
    impactDim.weightedScore +
    verbDim.weightedScore +
    formatDim.weightedScore +
    relevanceDim.weightedScore
  );

  const improvements = buildTopImprovements({
    keywordDim, sectionDim, impactDim, verbDim, formatDim, relevanceDim,
    missingKeywords: jdKeywords.filter(
      (k) => !resume.rawText.toLowerCase().includes(k.toLowerCase())
    ),
  });

  return {
    overallScore,
    grade: scoreToGrade(overallScore),
    dimensions: {
      keywordMatch: keywordDim,
      sectionCompleteness: sectionDim,
      quantifiedImpact: impactDim,
      actionVerbs: verbDim,
      formattingSignals: formatDim,
      experienceRelevance: relevanceDim,
    },
    matchedKeywords: jdKeywords.filter((k) =>
      resume.rawText.toLowerCase().includes(k.toLowerCase())
    ),
    missingKeywords: jdKeywords.filter(
      (k) => !resume.rawText.toLowerCase().includes(k.toLowerCase())
    ),
    topImprovements: improvements,
  };
}

// ─── Dimension Scorers ────────────────────────────────────────────────────────

async function extractJDKeywords(jd: string, role: string): Promise<string[]> {
  if (!jd.trim()) return [];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  });

  const prompt = `
Extract the most important ATS keywords from this job description for a ${role} role.
Return ONLY a JSON array of strings. Include: required skills, tools, frameworks, 
methodologies, domain terms. Max 40 keywords. Normalise case.

Job Description:
"""
${jd.slice(0, 4000)}
"""
`;
  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as string[];
  } catch {
    return extractKeywordsFallback(jd);
  }
}

function scoreKeywordMatch(resume: ParsedResume, jdKeywords: string[]): DimensionScore {
  if (!jdKeywords.length) {
    return { score: 50, weight: 0.30, weightedScore: 15, feedback: "No job description provided; keyword matching skipped." };
  }
  const lower = resume.rawText.toLowerCase();
  const matched = jdKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const score = Math.round((matched.length / jdKeywords.length) * 100);
  return {
    score,
    weight: 0.30,
    weightedScore: score * 0.30,
    feedback: score >= 70
      ? `Strong keyword coverage: ${matched.length}/${jdKeywords.length} JD terms found.`
      : `Only ${matched.length}/${jdKeywords.length} JD keywords found. Add missing skills to your resume.`,
  };
}

function scoreSectionCompleteness(resume: ParsedResume): DimensionScore {
  let points = 0;
  const checks: [boolean, number, string][] = [
    [!!resume.summary.trim(), 15, "Professional summary"],
    [resume.education.length > 0, 15, "Education section"],
    [resume.workExperience.length > 0, 25, "Work experience"],
    [resume.technicalSkills.length >= 5, 20, "Technical skills (5+)"],
    [resume.projects.length > 0, 15, "Projects section"],
    [!!resume.email && !!resume.phone, 10, "Contact details"],
  ];

  const missing: string[] = [];
  for (const [condition, pts, label] of checks) {
    if (condition) points += pts;
    else missing.push(label);
  }

  return {
    score: points,
    weight: 0.15,
    weightedScore: points * 0.15,
    feedback: missing.length === 0
      ? "All key resume sections are present."
      : `Missing or weak sections: ${missing.join(", ")}.`,
  };
}

function scoreQuantifiedImpact(resume: ParsedResume): DimensionScore {
  const allBullets = [
    ...resume.workExperience.flatMap((w) => w.responsibilities),
    ...resume.projects.map((p) => p.outcomes),
  ].join(" ");

  const numberMatches = (allBullets.match(/\d+[%x+]|\$\d+|\d+\s*(users|customers|ms|seconds|hours|days|%)/gi) ?? []).length;
  const totalBullets = resume.workExperience.reduce((s, w) => s + w.responsibilities.length, 0) + resume.projects.length;
  const ratio = totalBullets > 0 ? numberMatches / totalBullets : 0;

  const score = Math.min(100, Math.round(ratio * 200)); // 50% quantified = 100 score
  return {
    score,
    weight: 0.15,
    weightedScore: score * 0.15,
    feedback: score >= 60
      ? `Good use of metrics. ${numberMatches} quantified achievements detected.`
      : `Add numbers/metrics to your bullets. Only ${numberMatches} quantified achievements found.`,
  };
}

const ACTION_VERBS = [
  "built","developed","designed","led","managed","created","implemented","improved",
  "optimized","reduced","increased","launched","delivered","architected","automated",
  "deployed","collaborated","mentored","analysed","resolved","engineered","scaled",
  "integrated","streamlined","coordinated","established","spearheaded","drove",
];

function scoreActionVerbs(resume: ParsedResume): DimensionScore {
  const bullets = resume.workExperience.flatMap((w) => w.responsibilities);
  if (!bullets.length) return { score: 0, weight: 0.10, weightedScore: 0, feedback: "No work experience bullets found." };

  const strong = bullets.filter((b) => {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase();
    return ACTION_VERBS.includes(firstWord ?? "");
  }).length;

  const score = Math.round((strong / bullets.length) * 100);
  return {
    score,
    weight: 0.10,
    weightedScore: score * 0.10,
    feedback: score >= 60
      ? "Good use of action verbs in experience bullets."
      : `${bullets.length - strong} bullets don't start with strong action verbs.`,
  };
}

function scoreFormattingSignals(resume: ParsedResume): DimensionScore {
  let score = 0;
  if (resume.email) score += 25;
  if (resume.phone) score += 20;
  if (resume.linkedIn) score += 20;
  if (resume.github) score += 15;
  if (resume.parseConfidence >= 0.7) score += 20; // clean PDF = ATS-friendly

  return {
    score,
    weight: 0.10,
    weightedScore: score * 0.10,
    feedback: score >= 70
      ? "Resume is well-formatted with all key contact details."
      : "Add LinkedIn, GitHub, or clean up PDF formatting for better ATS readability.",
  };
}

async function scoreExperienceRelevance(
  resume: ParsedResume,
  jd: string,
  targetRole: string
): Promise<DimensionScore> {
  if (!jd.trim() || resume.workExperience.length === 0) {
    return {
      score: 50,
      weight: 0.20,
      weightedScore: 10,
      feedback: "Could not evaluate experience relevance — no JD or experience provided.",
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const expSummary = resume.workExperience
    .map((w) => `${w.role} at ${w.company}: ${w.responsibilities.slice(0, 3).join("; ")}`)
    .join("\n");

  const prompt = `
Rate how relevant this candidate's experience is to the job description on a scale of 0-100.
Return ONLY JSON: { "score": number, "feedback": string }

Target Role: ${targetRole}
Candidate Experience:
${expSummary}

Job Description (first 2000 chars):
${jd.slice(0, 2000)}
`;

  try {
    const result = await model.generateContent(prompt);
    const { score, feedback } = JSON.parse(result.response.text());
    return { score, weight: 0.20, weightedScore: score * 0.20, feedback };
  } catch {
    return { score: 50, weight: 0.20, weightedScore: 10, feedback: "Experience relevance evaluated with limited context." };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function buildTopImprovements(data: {
  keywordDim: DimensionScore;
  sectionDim: DimensionScore;
  impactDim: DimensionScore;
  verbDim: DimensionScore;
  formatDim: DimensionScore;
  relevanceDim: DimensionScore;
  missingKeywords: string[];
}): string[] {
  const improvements: Array<{ priority: number; text: string }> = [];

  if (data.keywordDim.score < 60 && data.missingKeywords.length > 0) {
    improvements.push({
      priority: 1,
      text: `Add these missing keywords to your resume: ${data.missingKeywords.slice(0, 5).join(", ")}`,
    });
  }
  if (data.impactDim.score < 50) {
    improvements.push({ priority: 2, text: "Quantify your achievements — add numbers, percentages, and metrics to your experience bullets." });
  }
  if (data.verbDim.score < 50) {
    improvements.push({ priority: 3, text: "Start each experience bullet with a strong action verb (Built, Led, Optimized, Delivered)." });
  }
  if (data.sectionDim.score < 70) {
    improvements.push({ priority: 4, text: data.sectionDim.feedback });
  }
  if (data.formatDim.score < 60) {
    improvements.push({ priority: 5, text: "Add your LinkedIn and GitHub profile links to improve ATS signals." });
  }
  if (data.relevanceDim.score < 60) {
    improvements.push({ priority: 6, text: "Tailor your experience descriptions to match the target role's language and responsibilities." });
  }

  return improvements
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((i) => i.text);
}

function extractKeywordsFallback(jd: string): string[] {
  const stopWords = new Set(["and","the","or","for","with","that","this","are","will","have","from","your","their","you","all","our","its"]);
  return [...new Set(
    jd.toLowerCase()
      .replace(/[^a-z0-9\s+#.]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w))
  )].slice(0, 30);
}
