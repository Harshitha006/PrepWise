"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
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
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signUp: async () => { },
    signIn: async () => { },
    signUpWithEmail: async () => { },
    signInWithEmail: async () => { },
    resetPassword: async () => { },
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
                    if (db) {
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
            if (!auth || !googleProvider) {
                throw Object.assign(
                    new Error("Firebase is not initialised — check your NEXT_PUBLIC_ environment variables."),
                    { alreadyHandled: false }
                );
            }
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            await setSessionCookie(idToken);
            toast.success("Signed in with Google!");
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            if (!error?.alreadyHandled) {
                toast.error(error?.message || "Google sign-in failed");
            }
            // Mark so the page-level catch block doesn't show a second toast
            throw Object.assign(error, { alreadyHandled: true });
        }
    };

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        try {
            if (!auth || !db) {
                throw new Error("Firebase is not initialised — check your NEXT_PUBLIC_ environment variables.");
            }
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

            await firebaseSignOut(auth);
            await deleteSessionCookie();

            toast.success("Account created! Please verify your email and sign in.");
        } catch (error: any) {
            console.error("Email sign-up error:", error);
            toast.error(error.message || "Registration failed");
            throw Object.assign(error, { alreadyHandled: true });
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            if (!auth) {
                throw new Error("Firebase is not initialised — check your NEXT_PUBLIC_ environment variables.");
            }
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await setSessionCookie(idToken);
            toast.success("Welcome back!");
        } catch (error: any) {
            console.error("Email sign-in error:", error);
            toast.error(error.message || "Invalid credentials");
            throw Object.assign(error, { alreadyHandled: true });
        }
    };

    const resetPassword = async (email: string) => {
        try {
            if (!auth) throw new Error("Firebase is not initialised — check your NEXT_PUBLIC_ environment variables.");
            await sendPasswordResetEmail(auth, email);
            toast.success("Password reset email sent!");
        } catch (error: any) {
            console.error("Reset password error:", error);
            toast.error(error.message || "Failed to send reset email");
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (auth) {
                await firebaseSignOut(auth);
            }
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
            signUp: signUpWithEmail,
            signIn: signInWithEmail,
            signUpWithEmail,
            signInWithEmail,
            resetPassword,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
