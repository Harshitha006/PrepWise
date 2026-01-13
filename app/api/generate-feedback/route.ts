import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { adminDb } from "@/firebase/admin";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

const feedbackSchema = z.object({
    overallScore: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    summary: z.string(),
    detailedFeedback: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        score: z.number(),
        critique: z.string(),
        betterVersion: z.string()
    }))
});

export async function POST(req: NextRequest) {
    try {
        const { sessionId, userId, answers } = await req.json();

        if (!answers || answers.length === 0) {
            return NextResponse.json({ success: false, error: "No answers provided" }, { status: 400 });
        }

        let feedback;

        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            try {
                const { object } = await generateObject({
                    model: google("gemini-1.5-flash-latest"),
                    schema: feedbackSchema,
                    prompt: `Analyze these interview answers and provide constructive feedback. Be encouraging but honest.
          
          Answers:
          ${answers.map((a: any, i: number) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join('\n\n')}
          
          Provide a score (0-100), key strengths, areas for improvement, and a summary.
          Also provide detailed feedback for each question.`,
                });
                feedback = object;
            } catch (aiError) {
                console.error("AI Feedback error:", aiError);
                feedback = generateFallbackFeedback(answers);
            }
        } else {
            feedback = generateFallbackFeedback(answers);
        }

        // Save feedback to the interview session
        if (adminDb && sessionId) {
            await adminDb.collection("interviews").doc(sessionId).update({
                feedback,
                status: "completed",
                completedAt: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            feedback
        });

    } catch (error: any) {
        console.error("Feedback generation error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

function generateFallbackFeedback(answers: any[]) {
    return {
        overallScore: 70,
        strengths: ["Completed the interview session", "Good effort in answering"],
        improvements: ["Try to be more specific", "Practice with more technical questions"],
        summary: "You've successfully completed the mock interview. Keep practicing to build more confidence!",
        detailedFeedback: answers.map(a => ({
            question: a.question,
            answer: a.answer,
            score: 70,
            critique: "Good start, but could benefit from more detailed examples.",
            betterVersion: "Try to follow the STAR method (Situation, Task, Action, Result) for better structure."
        }))
    };
}
