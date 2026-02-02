"use server";

import { adminAuth, adminDb } from "@/firebase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    if (!adminAuth) {
        throw new Error("Firebase Admin Auth not initialized. Check server environment variables.");
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get("__session")?.value;

    if (!session) return null;

    try {
        if (!adminAuth || !adminDb) {
            console.error("Firebase Admin not initialized in getCurrentUser");
            return null;
        }

        const decodedToken = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            console.warn("User document not found for UID:", decodedToken.uid);
            // Return basic info from the token so the app doesn't crash
            return {
                id: decodedToken.uid,
                name: decodedToken.name || decodedToken.email?.split('@')[0] || "User",
                email: decodedToken.email || "",
                isProfileIncomplete: true
            } as any;
        }

        return { id: decodedToken.uid, ...userDoc.data() } as any;
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        return null;
    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

export async function signOut() {
    await deleteSessionCookie();
    redirect("/sign-in");
}

export async function deleteSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete("__session");
}

export async function signUp(userData: { name: string; email: string; uid: string }) {
    try {
        if (!adminDb) throw new Error("Firebase Admin Firestore not initialized.");
        await adminDb.collection("users").doc(userData.uid).set({
            name: userData.name,
            email: userData.email,
            createdAt: new Date().toISOString(),
            resumeData: null,
            interviewHistory: []
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
