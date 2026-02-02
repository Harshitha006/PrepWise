"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, Key, Chrome } from "lucide-react";

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [showReset, setShowReset] = useState(false);

    const router = useRouter();
    const authContext = useAuth();
    const { signUp, signIn, signInWithGoogle, resetPassword } = authContext;
    console.log("LoginPage rendering, activeTab:", activeTab, "Auth context loading:", authContext.loading);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email, password);
            router.push("/");
            router.refresh();
        } catch (error) {
            // Already handled
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signUp(email, password, name);
            // Switch to login tab instead of redirecting to home
            setActiveTab("login");
            // We keep the email in the state so it's ready for login
            setPassword(""); // Clear password for safety
            console.log("Switched to login tab after successful signup");
        } catch (error) {
            // Already handled
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            router.push("/");
        } catch (error) {
            // Error is already handled in AuthContext
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setLoading(true);
        try {
            await resetPassword(resetEmail);
            setShowReset(false);
            setResetEmail("");
        } catch (error) {
            // Error is already handled in AuthContext
        } finally {
            setLoading(false);
        }
    };

    if (showReset) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-2xl">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10 bg-zinc-900 border-zinc-700"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button variant="ghost" onClick={() => setShowReset(false)}>
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">
                        {activeTab === "login" ? "Welcome Back" : "Create Account"}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === "login"
                            ? "Sign in to your PrepWise account"
                            : "Join PrepWise and start your AI interview prep"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => {
                        console.log("Tab changing to:", v);
                        setActiveTab(v);
                    }}>
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10 bg-zinc-900 border-zinc-700"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="text-xs text-blue-400 p-0 h-auto"
                                            onClick={() => setShowReset(true)}
                                        >
                                            Forgot password?
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 bg-zinc-900 border-zinc-700"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Signing in..." : "Sign In"}
                                </Button>

                                <div className="text-center text-sm text-zinc-400">
                                    Don&apos;t have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("signup")}
                                        className="text-blue-400 hover:underline"
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form
                                onSubmit={(e) => {
                                    console.log("Signup form submitted");
                                    handleSignUp(e);
                                }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="signup-name"
                                            type="text"
                                            placeholder="John Doe"
                                            className="pl-10 bg-zinc-900 border-zinc-700"
                                            value={name}
                                            onChange={(e) => {
                                                console.log("Name changed:", e.target.value);
                                                setName(e.target.value);
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10 bg-zinc-900 border-zinc-700"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 bg-zinc-900 border-zinc-700"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Must be at least 6 characters long
                                    </p>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Creating account..." : "Create Account"}
                                </Button>

                                <div className="text-center text-sm text-zinc-400">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("login")}
                                        className="text-blue-400 hover:underline"
                                    >
                                        Sign in
                                    </button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-zinc-900 text-zinc-400">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <Chrome className="mr-2 h-4 w-4" />
                        Sign in with Google
                    </Button>

                    <p className="text-xs text-zinc-500 text-center mt-6">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="text-blue-400 hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
