"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { adminDb } from "@/firebase/admin";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const feedbackSchema = z.object({
    totalScore: z.number().min(0).max(100),
    categoryScores: z.array(z.object({
        name: z.string(),
        score: z.number().min(0).max(100),
        comment: z.string()
    })),
    strengths: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    finalAssessment: z.string(),
});

export async function createFeedback(interviewId: string, userId: string, transcript: string) {
    try {
        const { object } = await generateObject({
            model: google("gemini-1.5-flash-latest"),
            schema: feedbackSchema,
            prompt: `Analyze this interview transcript and provide constructive feedback. 
      Transcript: ${transcript}
      Evaluate based on communication, technical knowledge, problem solving, cultural fit, and confidence.
      Total score should be an average of all scores.`,
        });

        const feedbackData = {
            interviewId,
            userId,
            ...object,
            createdAt: new Date().toISOString(),
        };

        if (!adminDb) throw new Error("Database not initialized");

        await adminDb.collection("feedback").add(feedbackData);

        // Update interview with score for dashboard display
        const interviewRef = adminDb.collection("interviews").doc(interviewId);
        await interviewRef.update({
            score: object.totalScore,
        });

        return { success: true, feedback: object };
    } catch (error: any) {
        console.error("Error generating feedback:", error);
        return { success: false, error: error.message };
    }
}
