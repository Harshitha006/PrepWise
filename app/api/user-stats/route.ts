import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User ID is required" },
                { status: 400 }
            );
        }

        if (!adminDb) {
            console.log("Database not initialized, returning mock data");
            return NextResponse.json({
                success: true,
                data: {
                    userId,
                    hasResume: false,
                    atsScore: 0,
                    interviewCount: 0,
                    lastInterview: null,
                    skills: [],
                    preferredRole: "Not set",
                    resumeUploaded: false,
                    mockData: true
                }
            });
        }

        // Get user data without complex queries to avoid index requirements
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        // Get all resumes and filter manually to avoid index requirement
        let latestResume = null;
        try {
            const resumesSnapshot = await adminDb.collection("resumes").get();
            const userResumes = resumesSnapshot.docs
                .filter(doc => doc.data().userId === userId)
                .sort((a, b) => {
                    const dateA = new Date(a.data().uploadDate || 0).getTime();
                    const dateB = new Date(b.data().uploadDate || 0).getTime();
                    return dateB - dateA; // Descending
                });

            if (userResumes.length > 0) {
                latestResume = userResumes[0].data();
                latestResume.id = userResumes[0].id;
            }
        } catch (dbError) {
            console.log("Error fetching resumes:", dbError);
        }

        // Get all interviews and filter manually
        let interviewCount = 0;
        try {
            const interviewsSnapshot = await adminDb.collection("interviews").get();
            interviewCount = interviewsSnapshot.docs.filter(doc =>
                doc.data().userId === userId
            ).length;
        } catch (dbError) {
            console.log("Error fetching interviews:", dbError);
        }

        return NextResponse.json({
            success: true,
            data: {
                userId,
                hasResume: !!(latestResume || userData?.hasResume),
                atsScore: latestResume?.analysis?.atsScore || userData?.atsScore || 0,
                interviewCount: interviewCount || userData?.interviewCount || 0,
                lastInterview: userData?.lastInterview || null,
                skills: latestResume?.analysis?.skills || userData?.skills || [],
                preferredRole: latestResume?.analysis?.jobRole || userData?.preferredRole || "Not set",
                resumeUploaded: !!latestResume,
                resumeId: latestResume?.id || null,
                experience: latestResume?.analysis?.experience || userData?.experience || "Not specified"
            }
        });

    } catch (error: any) {
        console.error("Error fetching user stats:", error);

        // Return mock data on error
        return NextResponse.json({
            success: true,
            data: {
                userId: req.nextUrl.searchParams.get("userId") || "unknown",
                hasResume: false,
                atsScore: 0,
                interviewCount: 0,
                lastInterview: null,
                skills: [],
                preferredRole: "Software Developer",
                resumeUploaded: false,
                mockData: true
            }
        });
    }
}
