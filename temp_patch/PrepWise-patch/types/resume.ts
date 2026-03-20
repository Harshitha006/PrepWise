// ============================================================
// types/resume.ts
// Shared types for the PrepWise Resume & Skill Enhancer system
// ============================================================

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
    languages: string[];
  };
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  projects: {
    name: string;
    description: string;
    techStack: string[];
  }[];
  certifications: string[];
  achievements: string[];
  rawText: string;
}

export interface ATSScore {
  overall: number; // 0–100
  breakdown: {
    keywordMatch: number;       // 0–100: how many JD keywords appear in resume
    sectionCompleteness: number; // 0–100: has all standard sections
    quantifiedAchievements: number; // 0–100: uses numbers/metrics
    actionVerbs: number;        // 0–100: strong action verbs
    readability: number;        // 0–100: clean formatting, no tables/images
    relevance: number;          // 0–100: overall JD alignment
    skillsCoverage: number;     // 0–100: % of required skills present
    experienceMatch: number;    // 0–100: years/level match
    educationMatch: number;     // 0–100: degree/field match
    lengthAppropriate: number;  // 0–100: 1–2 pages for early career
  };
  passesATS: boolean;
  criticalIssues: string[];
  suggestions: string[];
  jdMatchPercentage: number;
}

export interface SkillGap {
  presentSkills: string[];
  missingSkills: string[];
  partialSkills: { skill: string; gap: string }[];
  prioritySkillsToLearn: string[];
  overallMatchScore: number; // 0–100
}

export interface AssessmentQuestion {
  id: string;
  skill: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AssessmentResult {
  skill: string;
  score: number;         // 0–100
  level: "beginner" | "intermediate" | "advanced" | "expert";
  verified: boolean;     // true if score >= 70
  questionsAttempted: number;
  correctAnswers: number;
}

export interface RecruiterSimulation {
  shortlistProbability: number; // 0–100
  decision: "Strong Yes" | "Yes" | "Maybe" | "No" | "Strong No";
  reasoning: string;
  strengths: string[];
  redFlags: string[];
  firstImpressionScore: number;
  recruiterNotes: string;
  improveToGetShortlisted: string[];
}

export interface ImprovementPlan {
  resumeEdits: {
    section: string;
    issue: string;
    suggestion: string;
    priority: "high" | "medium" | "low";
  }[];
  skillsToLearn: {
    skill: string;
    reason: string;
    estimatedTime: string;
    resources: MicroLearningResource[];
  }[];
  shortTermGoals: string[];   // 1–2 weeks
  longTermGoals: string[];    // 1–3 months
  weeklyPlan: {
    week: number;
    focus: string;
    tasks: string[];
  }[];
}

export interface MicroLearningResource {
  title: string;
  type: "video" | "article" | "podcast" | "course" | "practice";
  url: string;
  duration: string;
  platform: string;
  free: boolean;
}

export interface ResumeAnalysisState {
  parsed: ParsedResume | null;
  atsScore: ATSScore | null;
  skillGap: SkillGap | null;
  assessmentResults: AssessmentResult[];
  recruiterSim: RecruiterSimulation | null;
  improvementPlan: ImprovementPlan | null;
  jobDescription: string;
  targetRole: string;
  isLoading: boolean;
  currentStep: number;
  completedSteps: number[];
}
