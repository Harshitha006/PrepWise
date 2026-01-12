"use server";

import { adminAuth, adminDb } from "@/firebase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
    });
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();

        if (!userDoc.exists) return null;

        return { id: decodedToken.uid, ...userDoc.data() } as any;
    } catch (error) {
        return null;
    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

export async function signOut() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/sign-in");
}

export async function signUp(userData: { name: string; email: string; uid: string }) {
    try {
        await adminDb.collection("users").doc(userData.uid).set({
            name: userData.name,
            email: userData.email,
            createdAt: new Date().toISOString(),
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
