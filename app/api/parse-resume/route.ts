// ============================================================
// app/api/parse-resume/route.ts
// FIXED: Robust PDF parser using pdf-parse + Gemini structured extraction
// Replaces the broken basic pdf-parse implementation
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfParse from "pdf-parse";
import { ParsedResume } from "@/types/resume";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// ── Gemini model for structured extraction ──────────────────
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1,        // Low temperature = deterministic/accurate
    responseMimeType: "application/json",
  },
});

// ── Clean raw PDF text before sending to Gemini ─────────────
function cleanPdfText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove repeated whitespace/blank lines
    .replace(/\n{3,}/g, "\n\n")
    // Remove page numbers like "Page 1 of 2" or just lone numbers
    .replace(/^Page\s+\d+\s+of\s+\d+$/gim, "")
    .replace(/^\s*\d+\s*$/gm, "")
    // Remove common PDF artifacts
    .replace(/[^\x00-\x7F]/g, (c) => {
      // Keep useful unicode like bullets •, em-dashes —, etc.
      const keep = ["•", "●", "◦", "▪", "–", "—", "→", "·"];
      return keep.includes(c) ? c : " ";
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// ── The extraction prompt ────────────────────────────────────
function buildExtractionPrompt(text: string): string {
  return `
You are an expert resume parser. Extract ALL information from the resume text below and return ONLY valid JSON matching the schema exactly. 

Rules:
- If a field is not found, use empty string "" or empty array []
- For skills: separate into technical (programming languages, frameworks, databases), soft (communication, leadership etc.), tools (IDEs, CI/CD, cloud platforms), and languages (spoken languages)
- For experience: extract each job separately with bullet points as description array
- Do NOT invent information — only extract what's present
- For projects: extract tech stack as separate array if mentioned
- Dates should be in format "Month Year – Month Year" or "Month Year – Present"

Resume Text:
---
${text}
---

Return this exact JSON schema:
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
    {
      "title": "",
      "company": "",
      "duration": "",
      "description": []
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": "",
      "gpa": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "techStack": []
    }
  ],
  "certifications": [],
  "achievements": []
}
`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // ── Step 1: Extract raw text from PDF ────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";
    let pdfParseError = false;

    try {
      const parserFn = (pdfParse as any).default || pdfParse;
      const pdfData = await parserFn(buffer, {
        // Preserve layout for better extraction
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });
      rawText = pdfData.text;
    } catch (err) {
      console.error("pdf-parse failed, falling back to buffer text:", err);
      pdfParseError = true;
      // Fallback: try to extract text directly from buffer as string
      rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\t]/g, " ");
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from PDF. The file may be scanned/image-based or corrupted. Please upload a text-based PDF.",
          hint: "Try exporting your resume from Word or Google Docs as PDF.",
        },
        { status: 422 }
      );
    }

    // ── Step 2: Clean the extracted text ─────────────────────
    const cleanedText = cleanPdfText(rawText);

    // ── Step 3: Gemini structured extraction ─────────────────
    const prompt = buildExtractionPrompt(cleanedText);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // ── Step 4: Parse and validate the JSON response ─────────
    let parsed: ParsedResume;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Gemini sometimes wraps JSON in markdown fences — strip them
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    }

    // ── Step 5: Attach rawText for downstream use ─────────────
    parsed.rawText = cleanedText;

    // ── Step 6: Sanity check ──────────────────────────────────
    const hasContent =
      parsed.name ||
      parsed.skills.technical.length > 0 ||
      parsed.experience.length > 0 ||
      parsed.education.length > 0;

    if (!hasContent) {
      return NextResponse.json(
        {
          error:
            "Resume parsed but appears empty. Please check the PDF content.",
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
        skillsFound:
          parsed.skills.technical.length +
          parsed.skills.tools.length,
        experienceCount: parsed.experience.length,
      },
    });
  } catch (error: unknown) {
    console.error("parse-resume error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to parse resume", details: message },
      { status: 500 }
    );
  }
}