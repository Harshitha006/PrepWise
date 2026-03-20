"use server";

import { getAdminDb } from "@/firebase/admin";

export async function getInterviewsByUserId(userId: string) {
    try {
        const db = getAdminDb();
        if (!db) return [];
        const snapshot = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching user interviews", error);
        return [];
    }
}

export async function getLatestInterviews({ userId, limit = 20 }: { userId: string; limit?: number }) {
    try {
        const db = getAdminDb();
        if (!db) return [];
        // Note: This query requires an index: finalized (asc) + userId (not equal) + createdAt (desc)
        // For simplicity, we'll fetch all finalized and filter in memory if the index isn't ready
        // But ideally we use the query.
        const snapshot = await db
            .collection("interviews")
            .where("finalized", "==", true)
            .limit(limit)
            .get();

        return snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter((interview: any) => interview.userId !== userId);
    } catch (error) {
        console.error("Error fetching latest interviews", error);
        return [];
    }
}

export async function getInterviewById(id: string) {
    try {
        const db = getAdminDb();
        if (!db) return null;
        const doc = await db.collection("interviews").doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as any;
    } catch (error) {
        return null;
    }
}

export async function getFeedbackByInterviewId(interviewId: string) {
    try {
        const db = getAdminDb();
        if (!db) return null;
        const snapshot = await db
            .collection("feedback")
            .where("interviewId", "==", interviewId)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
    } catch (error) {
        return null;
    }
}
