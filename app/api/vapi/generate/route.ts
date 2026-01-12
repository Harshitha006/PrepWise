import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { adminDb } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { type, role, level, techStack, amount, userId } = await req.json();

        const prompt = `You are an expert interviewer. Prepare ${amount} interview questions for a ${level} level ${role} position. 
    The interview type is ${type}. 
    Focus on these technologies: ${techStack}. 
    Return the questions in a JSON array of objects, where each object has a "question" field. 
    Example: [{"question": "Describe your experience with React Hooks."}]
    Only return the JSON array, no other text.`;

        const { text } = await generateText({
            model: google("gemini-1.5-flash"), // or gemini-2.0-flash if available
            prompt: prompt,
        });

        // Clean the text from potential markdown blocks
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(cleanedText);

        const interviewData = {
            userId,
            role,
            type,
            level,
            techStack: typeof techStack === "string" ? techStack.split(",").map(t => t.trim()) : techStack,
            questions,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        const docRef = await adminDb.collection("interviews").add(interviewData);

        return NextResponse.json({ id: docRef.id, success: true });
    } catch (error: any) {
        console.error("Error in generation API:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
