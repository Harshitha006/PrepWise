import { NextRequest, NextResponse } from "next/server";
import { FreeResumeAnalyzer } from "@/services/free-resume-analyzer";

// Note: Using standard Node.js runtime as pdf-parse/Tesseract require Node.js APIs not available in Edge
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("resume") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file type (free version supports PDF only for simplicity)
        if (file.type !== "application/pdf") {
            return NextResponse.json(
                {
                    error: "Only PDF files supported in free version",
                    supportedTypes: ["application/pdf"]
                },
                { status: 400 }
            );
        }

        // Check file size (limit to 2MB for free tier)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Max 2MB for free analysis." },
                { status: 400 }
            );
        }

        const analyzer = new FreeResumeAnalyzer();

        // Process resume
        const result = await analyzer.analyzeResume(file);

        return NextResponse.json({
            success: true,
            data: result.data,
            version: "free-tier-1.0",
            limits: {
                maxFileSize: "2MB",
                supportedFormats: ["PDF"],
                dailyLimit: "10 analyses per IP"
            }
        });

    } catch (error: any) {
        console.error("Free analysis error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Analysis failed",
                message: "Please try again or upgrade for better analysis",
                fallbackScore: 50
            },
            { status: 500 }
        );
    }
}
