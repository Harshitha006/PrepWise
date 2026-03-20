// ============================================================
// app/api/parse-resume/route.ts  — FIXED
//
// BUGS FIXED:
// 1. cleanPdfText() was stripping ALL non-ASCII including é,ñ,ü
//    → names/companies with accented chars became garbled
// 2. /^\s*\d+\s*$/gm was removing standalone years like "2023"
//    which appear alone on a line in columnar resume layouts
//    → experience dates were silently dropped
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";

// FIX: Set worker source to avoid "Cannot find module pdf.worker.mjs" in Next.js/Turbopack
PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/legacy/build/pdf.worker.min.mjs');

import { ParsedResume } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: { temperature: 0.1 },
});

function cleanPdfText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // FIX 1: Only strip FULL "Page X of Y" lines — NOT standalone years
    .replace(/^Page\s+\d+\s+of\s+\d+\s*$/gim, "")
    // FIX 2: Only remove standalone numbers that are clearly just page numbers
    // (single digit, or 2-digit, but NOT 4-digit years like 2023)
    .replace(/^\s*\d{1,2}\s*$/gm, "")
    // FIX 3: Keep accented/unicode characters — only remove truly garbage chars
    // (control chars, null bytes, etc.) but keep printable extended Latin
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize excessive spaces but keep structure
    .replace(/[ \t]{3,}/g, "  ")
    .trim();
}

function buildExtractionPrompt(text: string): string {
  return `You are an expert resume parser. Extract ALL information from the resume text below.
Return ONLY valid JSON — no explanation, no markdown fences.

Rules:
- If a field is missing, use "" or []
- skills.technical: programming languages, frameworks, databases, ML/AI tools
- skills.tools: IDEs, DevOps, cloud, version control, design tools
- skills.soft: leadership, communication, teamwork etc.
- skills.languages: spoken/written languages (English, Hindi, etc.)
- experience: each job as separate object; description = array of bullet points
- projects: include tech stack as array; extract from "Projects" or "Academic Projects" section
- certifications: course completions, professional certs
- achievements: awards, hackathon wins, publications, rankings
- summary: professional summary or objective statement if present

Resume Text:
---
${text}
---

Return exactly this schema:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "skills": {
    "technical": [],
    "soft": [],
    "tools": [],
    "languages": []
  },
  "experience": [
    { "title": "", "company": "", "duration": "", "description": [] }
  ],
  "education": [
    { "degree": "", "institution": "", "year": "", "gpa": "" }
  ],
  "projects": [
    { "name": "", "description": "", "techStack": [] }
  ],
  "certifications": [],
  "achievements": []
}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf")
      return NextResponse.json({ error: "Only PDF files supported" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    let rawText = "";
    let pdfParseError = false;

    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      rawText = result.text;
    } catch (err) {
      console.error("pdf-parse failed:", err);
      pdfParseError = true;
      rawText = buffer.toString("latin1").replace(/[\x00-\x08\x0E-\x1F\x7F]/g, " ");
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        {
          error: "Could not extract text from this PDF. It may be image-based or corrupted.",
          hint: "Export your resume as PDF from Word or Google Docs and try again.",
        },
        { status: 422 }
      );
    }

    const cleanedText = cleanPdfText(rawText);
    const prompt = buildExtractionPrompt(cleanedText);
    const result = await model.generateContent(prompt);

    let responseText = result.response.text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: ParsedResume;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Last resort: find JSON boundaries manually
      const start = responseText.indexOf("{");
      const end = responseText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(responseText.slice(start, end + 1));
      } else {
        throw new Error("Gemini returned unparseable response");
      }
    }

    parsed.rawText = cleanedText;

    const hasContent =
      parsed.name ||
      parsed.skills.technical.length > 0 ||
      parsed.experience.length > 0 ||
      parsed.education.length > 0;

    if (!hasContent) {
      return NextResponse.json(
        {
          error: "Resume parsed but appears empty. Check the PDF has selectable text.",
          rawTextSample: cleanedText.slice(0, 500),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      parsed,
      meta: {
        pdfParseError,
        charCount: cleanedText.length,
        skillsFound: parsed.skills.technical.length + parsed.skills.tools.length,
        experienceCount: parsed.experience.length,
      },
    });
  } catch (error: unknown) {
    console.error("parse-resume error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
