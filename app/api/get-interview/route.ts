import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");
        const userId = searchParams.get("userId");

        if (!sessionId || !userId) {
            return NextResponse.json(
                { success: false, error: "Missing sessionId or userId" },
                { status: 400 }
            );
        }

        if (!adminDb) {
            return NextResponse.json(
                { success: false, error: "Database not initialized" },
                { status: 500 }
            );
        }

        const interviewDoc = await adminDb.collection("interviews").doc(sessionId).get();

        if (!interviewDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview session not found" },
                { status: 404 }
            );
        }

        const sessionData = interviewDoc.data();

        // Basic security check: ensure user owns this session
        if (sessionData?.userId !== userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            session: sessionData
        });

    } catch (error: any) {
        console.error("Get interview error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
