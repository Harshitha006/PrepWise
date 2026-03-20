import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const sessionData = await req.json();
        const { sessionId, userId } = sessionData;

        if (!sessionId || !userId) {
            return NextResponse.json(
                { success: false, error: "Missing sessionId or userId" },
                { status: 400 }
            );
        }

        const db = getAdminDb();
        if (!db) {
            return NextResponse.json(
                { success: false, error: "Database not initialized" },
                { status: 500 }
            );
        }

        // Update the interview document
        await db.collection("interviews").doc(sessionId).set(sessionData, { merge: true });

        return NextResponse.json({
            success: true,
            message: "Interview progress saved"
        });

    } catch (error: any) {
        console.error("Save interview error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
