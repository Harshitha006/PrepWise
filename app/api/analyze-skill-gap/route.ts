import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const skillGapSchema = z.object({
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      currentLevel: z.string(),
      requiredLevel: z.string(),
      gapAnalysis: z.string(),
      resources: z.array(z.string()),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
      estimatedTimeToLearn: z.string(),
    }),
  ),
  priority: z.array(z.string()),
  overallReadiness: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
});

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const { resumeData, interviewFeedback, jobRequirements } = await req.json();

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const prompt = `You are an expert skill gap analyst. Analyze the skill gaps with high accuracy.

Job Requirements:
- Role: ${jobRequirements?.role || "Software Developer"}
- Required Experience: ${jobRequirements?.experience || "Not specified"}
- Key Required Skills: ${jobRequirements?.requiredSkills?.join(", ") || "Various technical skills"}

User's Current Skills:
${resumeData?.skills?.map((s: string) => `- ${s}`).join("\n") || "No skills provided"}

Interview Performance:
${JSON.stringify(interviewFeedback) || "No interview data available"}

Provide a detailed analysis with:
1. Specific skill gaps with current vs required levels
2. Priority (HIGH/MEDIUM/LOW) for each gap
3. Learning resources (courses, books, projects)
4. Estimated time to learn each skill
5. Overall readiness score (0-100)
6. Confidence score for your analysis (0-100)

Be accurate and realistic in your assessment.`;

    const { object } = await generateObject({
      model: google("gemini-1.5-pro-latest"),
      schema: skillGapSchema,
      prompt,
      temperature: 0.3,
    });

    const analysisTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...object,
      metadata: {
        analysisTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Skill gap analysis failed:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to analyze skill gaps",
      fallback: {
        skillGaps: [
          {
            skill: "Technical Skills",
            currentLevel: "Unknown",
            requiredLevel: "Varies by role",
            gapAnalysis: "Unable to perform detailed analysis",
            resources: ["Complete skill assessment first"],
            priority: "HIGH",
            estimatedTimeToLearn: "Variable",
          },
        ],
        priority: ["Complete skill assessment"],
        overallReadiness: 0,
        confidenceScore: 0,
      },
    });
  }
}
