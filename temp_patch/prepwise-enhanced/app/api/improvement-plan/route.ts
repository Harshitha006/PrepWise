// ============================================================
// app/api/improvement-plan/route.ts
// Personalized Improvement Plan + Micro-Learning Resources
// NEW: Did not exist before
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ParsedResume,
  ATSScore,
  SkillGap,
  AssessmentResult,
  RecruiterSimulation,
  ImprovementPlan,
  MicroLearningResource,
} from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.4,
    responseMimeType: "application/json",
  },
});

// ── Curated free learning resources per skill category ───────
const FREE_RESOURCES: Record<string, MicroLearningResource[]> = {
  react: [
    { title: "React Official Docs", type: "article", url: "https://react.dev", duration: "Self-paced", platform: "React.dev", free: true },
    { title: "React Full Course", type: "video", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", duration: "12 hrs", platform: "YouTube / freeCodeCamp", free: true },
  ],
  nodejs: [
    { title: "Node.js Official Guide", type: "article", url: "https://nodejs.org/en/learn", duration: "Self-paced", platform: "Node.js", free: true },
    { title: "The Odin Project - Node", type: "course", url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs", duration: "4–6 weeks", platform: "The Odin Project", free: true },
  ],
  python: [
    { title: "Python for Everybody", type: "course", url: "https://www.py4e.com", duration: "4–8 weeks", platform: "py4e.com", free: true },
    { title: "Real Python", type: "article", url: "https://realpython.com", duration: "Self-paced", platform: "Real Python", free: true },
  ],
  sql: [
    { title: "SQLZoo", type: "practice", url: "https://sqlzoo.net", duration: "5–10 hrs", platform: "SQLZoo", free: true },
    { title: "Mode SQL Tutorial", type: "course", url: "https://mode.com/sql-tutorial", duration: "3–5 hrs", platform: "Mode", free: true },
  ],
  docker: [
    { title: "Docker Get Started", type: "article", url: "https://docs.docker.com/get-started", duration: "2–4 hrs", platform: "Docker Docs", free: true },
    { title: "Docker for Beginners", type: "video", url: "https://www.youtube.com/watch?v=fqMOX6JJhGo", duration: "2 hrs", platform: "YouTube / freeCodeCamp", free: true },
  ],
  aws: [
    { title: "AWS Cloud Practitioner Essentials", type: "course", url: "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials", duration: "6 hrs", platform: "AWS Training", free: true },
    { title: "AWS Skill Builder", type: "course", url: "https://skillbuilder.aws", duration: "Self-paced", platform: "AWS Skill Builder", free: true },
  ],
  typescript: [
    { title: "TypeScript Handbook", type: "article", url: "https://www.typescriptlang.org/docs/handbook", duration: "Self-paced", platform: "TypeScript.org", free: true },
    { title: "Execute Program TypeScript", type: "practice", url: "https://www.executeprogram.com/courses/typescript", duration: "10 hrs", platform: "Execute Program", free: false },
  ],
  communication: [
    { title: "Toastmasters Free Resources", type: "article", url: "https://www.toastmasters.org/resources", duration: "Self-paced", platform: "Toastmasters", free: true },
    { title: "Coursera Communication Skills", type: "course", url: "https://www.coursera.org/learn/communication", duration: "10 hrs", platform: "Coursera", free: false },
  ],
  systemdesign: [
    { title: "System Design Primer", type: "article", url: "https://github.com/donnemartin/system-design-primer", duration: "Self-paced", platform: "GitHub", free: true },
    { title: "ByteByteGo Newsletter", type: "article", url: "https://bytebytego.com", duration: "Weekly", platform: "ByteByteGo", free: false },
  ],
  algorithms: [
    { title: "LeetCode Free Problems", type: "practice", url: "https://leetcode.com/problemset/all/?difficulty=EASY&status=NOT_STARTED", duration: "Ongoing", platform: "LeetCode", free: true },
    { title: "NeetCode Roadmap", type: "video", url: "https://neetcode.io/roadmap", duration: "Structured", platform: "NeetCode", free: true },
  ],
};

function getResourcesForSkill(skill: string): MicroLearningResource[] {
  const key = skill.toLowerCase().replace(/[.\s+#]/g, "");
  // Try exact match first
  if (FREE_RESOURCES[key]) return FREE_RESOURCES[key];
  // Try partial match
  const partialKey = Object.keys(FREE_RESOURCES).find((k) => key.includes(k) || k.includes(key));
  if (partialKey) return FREE_RESOURCES[partialKey];
  // Default generic resources
  return [
    {
      title: `${skill} Tutorial`,
      type: "video",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " tutorial")}`,
      duration: "Varies",
      platform: "YouTube",
      free: true,
    },
    {
      title: `${skill} on freeCodeCamp`,
      type: "course",
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skill)}`,
      duration: "Self-paced",
      platform: "freeCodeCamp",
      free: true,
    },
  ];
}

function buildImprovementPrompt(
  resume: ParsedResume,
  atsScore: ATSScore,
  skillGap: SkillGap,
  assessmentResults: AssessmentResult[],
  recruiterSim: RecruiterSimulation,
  targetRole: string
): string {
  const weakSkills = assessmentResults
    .filter((r) => !r.verified)
    .map((r) => `${r.skill} (scored ${r.score}%)`);

  return `
You are a career coach and technical mentor. Create a personalized improvement plan.

CANDIDATE ANALYSIS:
- Target Role: ${targetRole}
- ATS Score: ${atsScore.overall}/100
- JD Match: ${atsScore.jdMatchPercentage}%
- Recruiter Decision: ${recruiterSim.decision} (${recruiterSim.shortlistProbability}% shortlist chance)
- Missing Skills: ${skillGap.missingSkills.join(", ")}
- Weak Skills (failed assessment): ${weakSkills.join(", ") || "None tested yet"}
- Resume Issues: ${atsScore.criticalIssues.join("; ")}
- Recruiter Red Flags: ${recruiterSim.redFlags.join("; ")}
- Priority Skills to Learn: ${skillGap.prioritySkillsToLearn.join(", ")}

Create a practical, encouraging improvement plan. Return ONLY this JSON:
{
  "resumeEdits": [
    {
      "section": "section name (e.g., Summary, Experience, Skills)",
      "issue": "what is wrong",
      "suggestion": "exact specific fix to make",
      "priority": "high | medium | low"
    }
  ],
  "skillsToLearn": [
    {
      "skill": "skill name",
      "reason": "why this skill matters for ${targetRole}",
      "estimatedTime": "e.g., 2 weeks, 40 hours"
    }
  ],
  "shortTermGoals": ["3–5 goals achievable in 1–2 weeks"],
  "longTermGoals": ["3–4 goals for 1–3 months"],
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "main theme for the week",
      "tasks": ["specific daily/weekly tasks"]
    }
  ]
}

Rules:
- resumeEdits: max 6, focus on HIGH impact changes first
- skillsToLearn: max 5, ordered by priority
- weeklyPlan: 4 weeks total
- Be specific, not generic ("add 3 quantified metrics to each job bullet" not "improve your experience section")
`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      resume,
      atsScore,
      skillGap,
      assessmentResults = [],
      recruiterSim,
      targetRole = "Software Engineer",
    } = await req.json() as {
      resume: ParsedResume;
      atsScore: ATSScore;
      skillGap: SkillGap;
      assessmentResults: AssessmentResult[];
      recruiterSim: RecruiterSimulation;
      targetRole: string;
    };

    if (!resume || !atsScore || !skillGap || !recruiterSim) {
      return NextResponse.json(
        { error: "resume, atsScore, skillGap, and recruiterSim required" },
        { status: 400 }
      );
    }

    const prompt = buildImprovementPrompt(
      resume, atsScore, skillGap, assessmentResults, recruiterSim, targetRole
    );

    const result = await model.generateContent(prompt);
    let text = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const plan = JSON.parse(text) as Omit<ImprovementPlan, "skillsToLearn"> & {
      skillsToLearn: { skill: string; reason: string; estimatedTime: string }[];
    };

    // Attach curated learning resources to each skill
    const improvementPlan: ImprovementPlan = {
      ...plan,
      skillsToLearn: plan.skillsToLearn.map((s) => ({
        ...s,
        resources: getResourcesForSkill(s.skill),
      })),
    };

    return NextResponse.json({ success: true, improvementPlan });
  } catch (error: unknown) {
    console.error("improvement-plan error:", error);
    return NextResponse.json(
      { error: "Improvement plan generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
