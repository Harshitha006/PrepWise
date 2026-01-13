import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { adminDb } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
    console.log("--- Generation API Started ---");
    try {
        const body = await req.json();
        console.log("Request Body:", body);

        const { type, role, level, techStack, amount, userId } = body;

        if (!role || !userId) {
            console.error("Missing required fields:", { role, userId });
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const prompt = `You are an expert interviewer. Prepare ${amount} interview questions for a ${level} level ${role} position. 
    The interview type is ${type}. 
    Focus on these technologies: ${techStack}. 
    Return the questions as a structured object.`;

        console.log("Calling Gemini for structured generation...");

        const { object } = await generateObject({
            model: google("gemini-1.5-flash-latest"),
            schema: z.object({
                questions: z.array(z.object({
                    question: z.string()
                }))
            }),
            prompt: prompt,
        });

        console.log("Gemini Response Object:", JSON.stringify(object));

        const interviewData = {
            userId,
            role,
            type,
            level,
            techstack: typeof techStack === "string" ? techStack.split(",").map(t => t.trim()) : (Array.isArray(techStack) ? techStack : [String(techStack)]),
            questions: object.questions,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        if (!adminDb) {
            console.error("FIREBASE ERROR: adminDb is null. Check environment variables.");
            throw new Error("Database not initialized");
        }

        console.log("Saving to Firestore...");
        const docRef = await adminDb.collection("interviews").add(interviewData);
        console.log("Saved Success! ID:", docRef.id);

        return NextResponse.json({ id: docRef.id, success: true });
    } catch (error: any) {
        console.error("DETAILED API ERROR:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
