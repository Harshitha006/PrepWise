"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { signUpWithEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            await signUpWithEmail(email, password, name);
            toast.success("Account created!", {
                description: "Check your email for verification. Redirecting..."
            });

            setTimeout(() => {
                router.push("/sign-in");
            }, 2000);
        } catch (err: any) {
            // toast.error is already handled in AuthContext but we could add more here if needed
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-emerald-400" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Join PrepWise and ace your next interview
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 transition-colors"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 transition-colors"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 transition-colors"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 transition-colors"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-semibold shadow-lg shadow-emerald-900/20"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-zinc-400">
                            Already have an account?{" "}
                            <Link
                                href="/sign-in"
                                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
