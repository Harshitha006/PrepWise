"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { adminDb } from "@/firebase/admin";

const feedbackSchema = z.object({
    totalScore: z.number().min(0).max(100),
    categoryScores: z.object({
        communicationSkills: z.object({ score: z.number(), comment: z.string() }),
        technicalKnowledge: z.object({ score: z.number(), comment: z.string() }),
        problemSolving: z.object({ score: z.number(), comment: z.string() }),
        culturalFit: z.object({ score: z.number(), comment: z.string() }),
        confidenceAndClarity: z.object({ score: z.number(), comment: z.string() }),
    }),
    strengths: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    finalAssessment: z.string(),
});

export async function createFeedback(interviewId: string, userId: string, transcript: string) {
    try {
        const { object } = await generateObject({
            model: google("gemini-1.5-flash"),
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
