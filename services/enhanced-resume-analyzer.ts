import { PDFParse } from "pdf-parse";

// FIX: Set worker source
PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/legacy/build/pdf.worker.min.mjs');

import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

type StructuredResumeData = {
  personal: {
    emails: string[];
    phones: string[];
    linkedin: string[];
    github: string[];
  };
  education: string[];
  experience: string[];
  skills: string[];
  projects: string[];
  certifications: string[];
  hasExperience: boolean;
};

type InsightsPayload = {
  strengths: string[];
  improvements: string[];
  suggestedRoles: string[];
  keySkills: string[];
  missingSkills: string[];
  confidenceScore: number;
  summary: string;
  validatedAt?: string;
};

interface AccuracyMetrics {
  extractionAccuracy: number;
  parsingAccuracy: number;
  analysisAccuracy: number;
  overallAccuracy: number;
  confidenceScore: number;
  extractionErrors: string[];
  timestamp: Date;
}

export class EnhancedResumeAnalyzer {
  private metrics: AccuracyMetrics = {
    extractionAccuracy: 0,
    parsingAccuracy: 0,
    analysisAccuracy: 0,
    overallAccuracy: 0,
    confidenceScore: 0,
    extractionErrors: [],
    timestamp: new Date(),
  };

  private knownPatterns: Map<string, RegExp> = new Map([
    ["email", /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
    ["phone", /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g],
    ["linkedin", /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi],
    ["github", /github\.com\/[a-zA-Z0-9-]+/gi],
    ["education_keywords", /(?:bachelor|master|phd|b\.?tech|m\.?tech|b\.?sc|m\.?sc|bca|mca|bba|mba|university|college|institute)/gi],
    ["experience_keywords", /(?:experience|worked|developed|managed|led|created|implemented|designed|architected)/gi],
  ]);

  private skillsDatabase: Set<string> = new Set([
    "javascript", "python", "java", "c++", "c#", "ruby", "php", "swift", "kotlin",
    "react", "angular", "vue", "node", "express", "django", "flask", "spring",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "github",
    "sql", "mysql", "postgresql", "mongodb", "oracle", "redis", "elasticsearch",
    "html", "css", "sass", "bootstrap", "tailwind", "material-ui",
    "typescript", "redux", "webpack", "babel", "jest", "mocha", "chai",
    "machine learning", "ai", "data science", "pandas", "numpy", "tensorflow",
    "agile", "scrum", "jira", "confluence", "project management", "leadership",
  ]);

  async analyzeResume(file: File): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const extractionStart = Date.now();
      const { text, extractionMetrics } = await this.extractTextWithAccuracy(file);
      this.metrics.extractionAccuracy = extractionMetrics.accuracy;
      this.metrics.extractionErrors = extractionMetrics.errors;
      console.log(`📊 Text extraction completed in ${Date.now() - extractionStart}ms`);

      const parsingStart = Date.now();
      const { parsedData, parsingMetrics } = await this.parseWithValidation(text);
      this.metrics.parsingAccuracy = parsingMetrics.accuracy;
      console.log(`🔍 Parsing completed in ${Date.now() - parsingStart}ms`);

      const atsScore = this.calculateEnhancedATSScore(text, parsedData);
      const { insights, confidence } = await this.getEnhancedInsights(text, parsedData);

      this.metrics.analysisAccuracy = confidence;
      this.metrics.overallAccuracy =
        this.metrics.extractionAccuracy * 0.3 +
        this.metrics.parsingAccuracy * 0.3 +
        this.metrics.analysisAccuracy * 0.4;
      this.metrics.confidenceScore = confidence;
      this.metrics.timestamp = new Date();

      await this.saveMetricsToFile();

      return {
        success: true,
        data: {
          rawText: text,
          structured: parsedData,
          atsScore,
          insights,
          metrics: this.metrics,
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Analysis error:", error);
      return this.getEnhancedFallbackAnalysis();
    }
  }

  private async extractTextWithAccuracy(
    file: File,
  ): Promise<{ text: string; extractionMetrics: { accuracy: number; errors: string[] } }> {
    const errors: string[] = [];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      await parser.destroy();
      if (data.text && data.text.length > 100) {
        if (!data.text.match(/[a-zA-Z]/)) errors.push("No alphabetic characters found");
        if (data.text.length < 200) errors.push("Text too short - possible extraction failure");

        const accuracy = this.calculateExtractionAccuracy(data.text);
        return { text: data.text, extractionMetrics: { accuracy, errors } };
      }

      errors.push("PDF parse failed, falling back to OCR");
      const image = await this.convertPDFToImage(buffer);
      const { data: { text } } = await Tesseract.recognize(image, "eng");
      const accuracy = this.calculateExtractionAccuracy(text || "");
      return { text: text || "Unable to extract text", extractionMetrics: { accuracy, errors } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown extraction error";
      errors.push(`Extraction error: ${message}`);
      return { text: "Unable to extract text from PDF", extractionMetrics: { accuracy: 0, errors } };
    }
  }

  private calculateExtractionAccuracy(text: string): number {
    if (!text) return 0;
    let accuracy = 100;
    const gibberishPattern = /[^a-zA-Z0-9\s.,!?;:'"()\-]/g;
    const gibberishCount = (text.match(gibberishPattern) || []).length;
    if (gibberishCount > text.length * 0.1) accuracy -= 30;
    if (text.includes("undefined") || text.includes("null")) accuracy -= 20;

    const words = text.split(/\s+/).filter(Boolean);
    const uniqueWords = new Set(words.map((word) => word.toLowerCase())).size;
    if (words.length > 0 && uniqueWords / words.length < 0.3) accuracy -= 25;

    return Math.max(0, accuracy);
  }

  private async parseWithValidation(
    text: string,
  ): Promise<{ parsedData: StructuredResumeData; parsingMetrics: { accuracy: number } }> {
    const parsedData: StructuredResumeData = {
      personal: { emails: [], phones: [], linkedin: [], github: [] },
      education: [],
      experience: [],
      skills: [],
      projects: [],
      certifications: [],
      hasExperience: false,
    };

    let confidence = 0;
    let totalChecks = 0;

    try {
      const emails = text.match(this.knownPatterns.get("email") || /$^/) || [];
      parsedData.personal.emails = [...new Set(emails)];
      totalChecks += 15;
      if (parsedData.personal.emails.length > 0) confidence += 15;

      const phones = text.match(this.knownPatterns.get("phone") || /$^/) || [];
      parsedData.personal.phones = [...new Set(phones)];
      totalChecks += 10;
      if (parsedData.personal.phones.length > 0) confidence += 10;

      parsedData.personal.linkedin = [...new Set(text.match(this.knownPatterns.get("linkedin") || /$^/) || [])];
      parsedData.personal.github = [...new Set(text.match(this.knownPatterns.get("github") || /$^/) || [])];

      const foundSkills = new Set<string>();
      const textLower = text.toLowerCase();
      this.skillsDatabase.forEach((skill) => {
        if (textLower.includes(skill)) foundSkills.add(skill);
        else {
          const skillWords = skill.split(/\s+/);
          if (skillWords.length > 1 && skillWords.every((word) => textLower.includes(word))) {
            foundSkills.add(skill);
          }
        }
      });
      parsedData.skills = Array.from(foundSkills);
      totalChecks += 30;
      confidence += Math.min(parsedData.skills.length * 2, 30);

      const educationMatches = text.match(this.knownPatterns.get("education_keywords") || /$^/) || [];
      parsedData.education = [...new Set(educationMatches)];
      totalChecks += 20;
      if (parsedData.education.length > 0) confidence += 20;

      const experienceMatches = text.match(this.knownPatterns.get("experience_keywords") || /$^/) || [];
      parsedData.experience = experienceMatches;
      parsedData.hasExperience = experienceMatches.length > 5;
      totalChecks += 25;
      if (parsedData.hasExperience) confidence += 25;

      const parsingAccuracy = totalChecks > 0 ? (confidence / totalChecks) * 100 : 50;
      return { parsedData, parsingMetrics: { accuracy: parsingAccuracy } };
    } catch (error) {
      console.error("Parsing error:", error);
      return { parsedData, parsingMetrics: { accuracy: 0 } };
    }
  }

  private calculateEnhancedATSScore(text: string, structuredData: StructuredResumeData): {
    score: number;
    grade: string;
    breakdown: Record<string, number>;
    percentile: number;
    recommendations: string[];
  } {
    const weights = { contact: 0.1, skills: 0.25, education: 0.15, experience: 0.3, formatting: 0.1, keywords: 0.1 };
    let score = 0;

    const breakdown: Record<string, number> = {};
    const contactScore =
      (structuredData.personal.emails.length > 0 ? 5 : 0) +
      (structuredData.personal.phones.length > 0 ? 5 : 0);
    breakdown.contact = contactScore;
    score += contactScore * weights.contact;

    const skillsScore = Math.min((structuredData.skills.length || 0) * 3, 25);
    breakdown.skills = skillsScore;
    score += skillsScore * weights.skills;

    let educationScore = Math.min(structuredData.education.length * 5, 15);
    const lower = text.toLowerCase();
    if (lower.includes("bachelor") || lower.includes("b.tech")) educationScore += 5;
    if (lower.includes("master") || lower.includes("m.tech")) educationScore += 5;
    if (lower.includes("phd")) educationScore += 5;
    breakdown.education = Math.min(educationScore, 15);
    score += breakdown.education * weights.education;

    const sentences = text.split(/[.!?]+/);
    const expSentences = sentences.filter((s) => /experience|worked|developed/i.test(s));
    let experienceScore = Math.min(expSentences.length * 2, 20);
    if ((text.match(/\d+%/g) || []).length > 0) experienceScore += 5;
    if (/\bled\b|\bmanaged\b/i.test(text)) experienceScore += 5;
    breakdown.experience = Math.min(experienceScore, 30);
    score += breakdown.experience * weights.experience;

    let formattingScore = 0;
    if (text.split("\n\n").length > 3) formattingScore += 3;
    if ((text.match(/\b\d{4}\b/g) || []).length > 2) formattingScore += 3;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > 300 && wordCount < 800) formattingScore += 4;
    breakdown.formatting = formattingScore;
    score += formattingScore * weights.formatting;

    const keywordScore = Math.min(structuredData.skills.length * 0.5, 10);
    breakdown.keywords = keywordScore;
    score += keywordScore * weights.keywords;

    const finalScore = Math.min(score, 100);
    const grade = finalScore >= 90 ? "A+" : finalScore >= 80 ? "A" : finalScore >= 70 ? "B+" : finalScore >= 60 ? "B" : finalScore >= 50 ? "C" : finalScore >= 40 ? "D" : "F";

    return {
      score: finalScore,
      grade,
      breakdown,
      percentile: finalScore,
      recommendations: this.generateRecommendations(breakdown),
    };
  }

  private generateRecommendations(breakdown: Record<string, number>): string[] {
    const recommendations: string[] = [];
    if (breakdown.contact < 8) recommendations.push("Add complete contact information (email and phone)");
    if (breakdown.skills < 15) recommendations.push("Include more relevant technical skills from the job description");
    if (breakdown.experience < 20) recommendations.push("Add quantifiable achievements with percentages and metrics");
    if (breakdown.education < 10) recommendations.push("Include education details with graduation dates");
    if (breakdown.formatting < 7) recommendations.push("Improve resume formatting with clear section headers");
    if (breakdown.keywords < 6) recommendations.push("Add more industry-specific keywords from job postings");
    return recommendations;
  }

  private async getEnhancedInsights(
    text: string,
    parsedData: StructuredResumeData,
  ): Promise<{ insights: InsightsPayload; confidence: number }> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return { insights: this.getEnhancedFallbackInsights(parsedData), confidence: 60 };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      const prompt = `You are an expert resume analyzer. Analyze this resume and return strict JSON only.\n
Resume Text: ${text.substring(0, 4000)}\n
Extracted Data: ${JSON.stringify(parsedData)}\n
Return JSON keys: strengths (string[]), improvements (string[]), suggestedRoles (string[]), keySkills (string[]), missingSkills (string[]), confidenceScore (number 0-100), summary (string).`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText) as InsightsPayload;
      const confidence = typeof parsed.confidenceScore === "number"
        ? parsed.confidenceScore
        : this.calculateInsightConfidence(parsed, parsedData);

      return {
        insights: { ...parsed, validatedAt: new Date().toISOString() },
        confidence,
      };
    } catch (error) {
      console.error("AI insights error:", error);
      return { insights: this.getEnhancedFallbackInsights(parsedData), confidence: 40 };
    }
  }

  private calculateInsightConfidence(insights: Partial<InsightsPayload>, parsedData: StructuredResumeData): number {
    let confidence = 70;
    if (parsedData.skills.length > 10) confidence += 10;
    if (parsedData.experience.length > 3) confidence += 10;
    if (parsedData.education.length > 1) confidence += 5;
    if ((insights.strengths || []).length > 2) confidence += 5;
    if ((insights.improvements || []).length > 2) confidence += 5;
    if ((insights.suggestedRoles || []).length > 2) confidence += 5;
    return Math.min(confidence, 100);
  }

  private getEnhancedFallbackInsights(parsedData: StructuredResumeData): InsightsPayload {
    return {
      strengths: [
        `${parsedData.skills.length} relevant skills identified`,
        parsedData.hasExperience ? "Professional experience section present" : "Clear resume structure",
        "Contact information available",
      ],
      improvements: [
        "Add more quantifiable achievements with metrics",
        "Include relevant certifications",
        "Optimize for ATS with more industry keywords",
      ],
      suggestedRoles: ["Software Developer", "Web Developer", "Technical Specialist"],
      keySkills: parsedData.skills.slice(0, 5),
      missingSkills: ["System Design", "Cloud Architecture", "Team Leadership"],
      confidenceScore: 60,
      summary: "Resume has basic structure but needs optimization for better ATS performance.",
    };
  }

  private async saveMetricsToFile(): Promise<void> {
    try {
      const metricsDir = "./accuracy-metrics";
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }

      const day = new Date().toISOString().split("T")[0];
      const filename = `${metricsDir}/metrics-${day}.json`;
      let existingMetrics: Array<Record<string, unknown>> = [];

      if (fs.existsSync(filename)) {
        const fileContent = fs.readFileSync(filename, "utf-8");
        existingMetrics = JSON.parse(fileContent) as Array<Record<string, unknown>>;
      }

      existingMetrics.push({ ...this.metrics, timestamp: new Date().toISOString() });
      fs.writeFileSync(filename, JSON.stringify(existingMetrics, null, 2));
    } catch (error) {
      console.error("Failed to save metrics:", error);
    }
  }

  private async convertPDFToImage(pdfBuffer: Buffer): Promise<string> {
    return `data:image/png;base64,${pdfBuffer.toString("base64")}`;
  }

  private getEnhancedFallbackAnalysis(): { success: false; data: Record<string, unknown> } {
    return {
      success: false,
      data: {
        atsScore: {
          score: 45,
          grade: "D",
          breakdown: { contact: 5, skills: 10, education: 5, experience: 10, formatting: 5, keywords: 10 },
          recommendations: ["Please upload a clear, text-based PDF resume for accurate analysis"],
        },
        metrics: this.metrics,
      },
    };
  }
}
