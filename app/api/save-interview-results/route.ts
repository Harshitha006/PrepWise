import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, sessionId, answers, questions, completedAt } = body;

        if (!userId || !sessionId) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const db = getAdminDb();
        if (!db) {
            // Logic for when Firebase Admin is not available
            return NextResponse.json({
                success: true,
                message: "Interview results processed (DB bypass mode)",
                results: { sessionId, completedAt }
            });
        }

        // Save formal results to interviewResults collection
        await db.collection("interviewResults").doc(sessionId).set({
            userId,
            sessionId,
            answers,
            questions,
            completedAt,
            status: "completed",
            analyzed: false // Will be set to true after AI feedback generation
        });

        // Update the original session document
        await db.collection("interviewSessions").doc(sessionId).update({
            status: "completed",
            completedAt
        });

        // Update user statistics
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            await userRef.update({
                interviewCount: (userDoc.data()?.interviewCount || 0) + 1,
                lastInterviewAt: completedAt
            });
        }

        return NextResponse.json({
            success: true,
            message: "Interview results saved successfully",
            sessionId
        });

    } catch (error: any) {
        console.error("Save interview results error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save interview results" },
            { status: 500 }
        );
    }
}
