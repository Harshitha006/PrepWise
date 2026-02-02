"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    User
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/firebase/client";
import { setSessionCookie, deleteSessionCookie } from "@/lib/actions/auth.action";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signUpWithEmail: async () => { },
    signInWithEmail: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if user document exists, create if not (primarily for Google sign-in)
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, "users", user.uid), {
                            email: user.email,
                            name: user.displayName || user.email?.split('@')[0],
                            createdAt: new Date().toISOString(),
                            resumeData: null,
                            interviewHistory: []
                        });
                    }
                } catch (error) {
                    console.error("Error ensuring user document:", error);
                }
                setUser(user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            await setSessionCookie(idToken);
            toast.success("Signed in with Google!");
        } catch (error) {
            console.error("Google sign-in error:", error);
            toast.error("Google sign-in failed");
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with name
            await updateProfile(userCredential.user, { displayName: name });

            // Send email verification
            await sendEmailVerification(userCredential.user);

            // Create user document
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: userCredential.user.email,
                name: name,
                createdAt: new Date().toISOString(),
                resumeData: null,
                interviewHistory: []
            });

            // We sign out after registration to require manual login (as per existing logic preference)
            // or we can just stay logged in. The user's suggestion said:
            // "Don't set user here - let onAuthStateChanged handle it. This allows showing verification message"
            // But typically we'd sign out if we want them to verify first.
            await firebaseSignOut(auth);
            await deleteSessionCookie();

            toast.success("Account created! Please verify your email and sign in.");
        } catch (error: any) {
            console.error("Email sign-up error:", error);
            toast.error(error.message || "Registration failed");
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await setSessionCookie(idToken);
            toast.success("Welcome back!");
        } catch (error: any) {
            console.error("Email sign-in error:", error);
            toast.error(error.message || "Invalid credentials");
            throw error;
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            await deleteSessionCookie();
            setUser(null);
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Logout failed");
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signInWithGoogle,
            signUpWithEmail,
            signInWithEmail,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
