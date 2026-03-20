/**
 * services/resumeParser.ts
 *
 * REPLACES the old pdf-parse approach.
 *
 * Strategy:
 *  1. Use pdf-parse ONLY to extract raw text (it's fine for that).
 *  2. Feed raw text into Gemini with a strict JSON schema prompt.
 *  3. Return a rich, structured ParsedResume object.
 *
 * Why this is better than the old code:
 *  - pdf-parse alone cannot reliably split sections, detect skills vs projects, etc.
 *  - Gemini understands context, handles multi-column PDFs, and normalises varied formats.
 *  - We request JSON-mode output so parsing is deterministic.
 */

import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;          // e.g. "Jun 2022 – Aug 2023"
  durationMonths: number;    // computed / estimated
  responsibilities: string[];
  technologiesUsed: string[];
}

export interface Project {
  name: string;
  description: string;
  technologiesUsed: string[];
  outcomes: string;          // measurable results if present
  links: string[];           // GitHub / live URL if present
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  gpa?: string;
  relevantCoursework: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  credentialId?: string;
}

export interface ParsedResume {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  portfolio: string;
  summary: string;

  // Skill buckets
  technicalSkills: string[];       // languages, frameworks, tools
  softSkills: string[];            // communication, leadership, etc.
  domainSkills: string[];          // e.g. "Machine Learning", "DevOps"
  certifications: Certification[];

  education: Education[];
  workExperience: WorkExperience[];
  projects: Project[];

  // Meta
  totalExperienceMonths: number;
  rawText: string;                 // kept for ATS keyword matching
  parseConfidence: number;        // 0-1, how clean the extraction was
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function parseResumePDF(pdfBuffer: Buffer): Promise<ParsedResume> {
  // Step 1 – Extract raw text
  let rawText = "";
  try {
    const parsed = await pdfParse(pdfBuffer);
    rawText = parsed.text.trim();
  } catch (err) {
    throw new Error(`PDF text extraction failed: ${(err as Error).message}`);
  }

  if (!rawText || rawText.length < 100) {
    throw new Error(
      "Could not extract meaningful text from this PDF. It may be image-only or password-protected."
    );
  }

  // Step 2 – Ask Gemini to structure the text
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // low temp = deterministic structured output
    },
  });

  const prompt = `
You are a senior technical recruiter and resume parser.
Parse the resume text below into the EXACT JSON schema provided.
Rules:
- Output ONLY valid JSON matching the schema. No markdown, no prose.
- If a field is missing in the resume, use "" for strings, [] for arrays, 0 for numbers.
- Normalise skill names (e.g. "JS" → "JavaScript", "ML" → "Machine Learning").
- Estimate durationMonths from job dates; use 6 if unclear.
- Separate technical skills (tools/languages/frameworks) from soft skills and domain skills.
- parseConfidence: 1.0 if resume is well-structured, lower if messy/image-heavy.

JSON Schema:
{
  "fullName": string,
  "email": string,
  "phone": string,
  "location": string,
  "linkedIn": string,
  "github": string,
  "portfolio": string,
  "summary": string,
  "technicalSkills": string[],
  "softSkills": string[],
  "domainSkills": string[],
  "certifications": [{ "name": string, "issuer": string, "year": string, "credentialId": string }],
  "education": [{
    "institution": string, "degree": string, "field": string,
    "graduationYear": string, "gpa": string, "relevantCoursework": string[]
  }],
  "workExperience": [{
    "company": string, "role": string, "duration": string, "durationMonths": number,
    "responsibilities": string[], "technologiesUsed": string[]
  }],
  "projects": [{
    "name": string, "description": string, "technologiesUsed": string[],
    "outcomes": string, "links": string[]
  }],
  "totalExperienceMonths": number,
  "parseConfidence": number
}

Resume text:
\`\`\`
${rawText.slice(0, 12000)} 
\`\`\`
`;

  try {
    const result = await model.generateContent(prompt);
    const jsonText = result.response.text().trim();
    const structured = JSON.parse(jsonText) as Omit<ParsedResume, "rawText">;
    return { ...structured, rawText };
  } catch (err) {
    console.error("Gemini parsing error:", err);
    // Graceful fallback: return minimal object with raw text
    return buildFallbackParsed(rawText);
  }
}

function buildFallbackParsed(rawText: string): ParsedResume {
  // Very basic regex fallbacks so the app doesn't crash
  const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const phoneMatch = rawText.match(/[\+]?[\d\s\-().]{10,}/);

  return {
    fullName: "",
    email: emailMatch?.[0] ?? "",
    phone: phoneMatch?.[0]?.trim() ?? "",
    location: "",
    linkedIn: "",
    github: "",
    portfolio: "",
    summary: "",
    technicalSkills: extractSkillsFallback(rawText),
    softSkills: [],
    domainSkills: [],
    certifications: [],
    education: [],
    workExperience: [],
    projects: [],
    totalExperienceMonths: 0,
    rawText,
    parseConfidence: 0.3,
  };
}

const COMMON_TECH_SKILLS = [
  "Python","JavaScript","TypeScript","Java","C++","C#","Go","Rust","Swift","Kotlin",
  "React","Next.js","Vue","Angular","Node.js","Express","Django","Flask","FastAPI",
  "PostgreSQL","MySQL","MongoDB","Redis","Firebase","Supabase",
  "AWS","GCP","Azure","Docker","Kubernetes","Terraform","CI/CD","Git",
  "Machine Learning","Deep Learning","TensorFlow","PyTorch","scikit-learn",
  "REST API","GraphQL","gRPC","Microservices","System Design",
];

function extractSkillsFallback(text: string): string[] {
  const lower = text.toLowerCase();
  return COMMON_TECH_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
}
