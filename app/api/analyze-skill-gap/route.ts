import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const skillGapSchema = z.object({
    skillGaps: z.array(z.object({
        skill: z.string(),
        currentLevel: z.string(),
        requiredLevel: z.string(),
        gapAnalysis: z.string(),
        resources: z.array(z.string())
    })),
    recommendations: z.array(z.string()),
    timeline: z.string(),
    priority: z.array(z.string())
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, resumeData, interviewFeedback, jobRequirements } = body;

        const skillGapPrompt = `
      Based on:
      1. Resume Skills: ${resumeData?.skills?.join(", ") || "None provided"}
      2. Interview Performance Score: ${interviewFeedback?.overallScore || "0"}/100
      3. Target Role: ${jobRequirements?.role || "Software Engineer"}
      4. Required Skills: ${jobRequirements?.requiredSkills?.join(", ") || "Technical proficiency"}
      
      Identify specific skill gaps and provide learning recommendations in the specified JSON structure.
    `;

        const { object: skillGapAnalysis } = await generateObject({
            model: google("gemini-1.5-flash-latest"),
            schema: skillGapSchema,
            prompt: skillGapPrompt
        });

        return NextResponse.json({
            success: true,
            ...skillGapAnalysis
        });

    } catch (error: any) {
        console.error("Skill Gap Analysis Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
