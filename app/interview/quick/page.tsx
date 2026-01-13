"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SimpleInterviewAgent from "@/components/SimpleInterviewAgent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Clock, Zap, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function QuickInterviewPage() {
    const [userId, setUserId] = useState<string>("");
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewComplete, setInterviewComplete] = useState(false);
    const [results, setResults] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const localUserId = localStorage.getItem("userId") || `user_${Date.now()}`;
        setUserId(localUserId);
        localStorage.setItem("userId", localUserId);
    }, []);

    const handleInterviewComplete = (interviewResults: any) => {
        setResults(interviewResults);
        setInterviewComplete(true);

        // Save to history
        const history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
        history.push({
            ...interviewResults,
            date: new Date().toISOString(),
            type: "quick"
        });
        localStorage.setItem("interviewHistory", JSON.stringify(history));

        toast.success("Quick Interview Complete!", {
            description: "Your results have been saved.",
            duration: 3000
        });
    };

    const handleViewResults = () => {
        if (results) {
            // Navigate to results page
            router.push(`/interview/results?sessionId=${results.sessionId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
            <Navbar />

            <div className="max-w-4xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        onClick={() => router.push("/")}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>

                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Quick Interview</span>
                    </div>
                </div>

                {!interviewStarted ? (
                    <>
                        {/* Intro Card */}
                        <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/20 mb-8">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white">Quick Practice Interview</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    5 questions • Approx. 10 minutes • No setup required
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-zinc-800/30 rounded-lg">
                                        <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                        <div className="font-semibold text-white">10 Minutes</div>
                                        <div className="text-sm text-zinc-400">Quick practice</div>
                                    </div>

                                    <div className="text-center p-4 bg-zinc-800/30 rounded-lg">
                                        <Brain className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                        <div className="font-semibold text-white">5 Questions</div>
                                        <div className="text-sm text-zinc-400">Mixed types</div>
                                    </div>

                                    <div className="text-center p-4 bg-zinc-800/30 rounded-lg">
                                        <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                                        <div className="font-semibold text-white">Instant Feedback</div>
                                        <div className="text-sm text-zinc-400">AI analysis</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-white">What to expect:</h4>
                                    <ul className="space-y-2 text-sm text-zinc-400">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <span>3 technical questions about programming and development</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <span>2 behavioral questions about experience and teamwork</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <span>Voice interaction - speak your answers naturally</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <span>Performance analysis after completion</span>
                                        </li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={() => setInterviewStarted(true)}
                                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-lg font-semibold"
                                >
                                    Start Quick Interview
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Tips */}
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                            <CardHeader>
                                <CardTitle className="text-emerald-300">Tips for Success</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                                        <span className="text-zinc-300">Find a quiet place where you can speak clearly</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                                        <span className="text-zinc-300">Take a moment to think before answering</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                                        <span className="text-zinc-300">Be specific and use examples from your experience</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                                        <span className="text-zinc-300">Don't worry about perfection - this is practice!</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </>
                ) : !interviewComplete ? (
                    <SimpleInterviewAgent
                        userId={userId}
                        onComplete={handleInterviewComplete}
                    />
                ) : (
                    <Card className="border-emerald-500/20 bg-gradient-to-br from-zinc-900/80 to-emerald-900/20">
                        <CardContent className="p-8 text-center">
                            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                <CheckCircle className="h-10 w-10 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Interview Complete!
                            </h3>
                            <p className="text-zinc-400 mb-6">
                                Great job completing the quick interview practice
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={handleViewResults}
                                    className="bg-gradient-to-r from-emerald-600 to-cyan-600"
                                >
                                    View Detailed Results
                                </Button>
                                <Button
                                    onClick={() => router.push("/interview/practice")}
                                    variant="outline"
                                >
                                    Try Custom Interview
                                </Button>
                                <Button
                                    onClick={() => router.push("/")}
                                    variant="ghost"
                                >
                                    Back to Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
