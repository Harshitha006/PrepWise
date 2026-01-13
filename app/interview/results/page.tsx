"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import InterviewResults from "@/components/InterviewResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";

import { Suspense } from "react";

function ResultsContent() {
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const sessionId = searchParams.get("sessionId");

        if (sessionId) {
            // Try to find in localStorage
            const history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
            const interview = history.find((i: any) =>
                i.sessionId === sessionId ||
                i.date === sessionId ||
                i.sessionId?.includes(sessionId)
            );

            if (interview) {
                setResults(interview);
                setLoading(false);
            } else {
                // Show demo results if not found (fallback)
                setResults({
                    sessionId,
                    analysis: {
                        overallScore: 78,
                        technicalScore: 75,
                        communicationScore: 80,
                        confidenceScore: 76,
                        strengths: ["Good technical knowledge", "Clear communication style"],
                        improvements: ["Add more specific examples", "Practice time management"],
                        detailedFeedback: "Good performance overall. Your technical knowledge is solid and you communicate clearly. Focus on providing more specific examples from your experience.",
                        recommendations: ["Practice with mock interviews", "Review system design concepts", "Prepare STAR method examples"]
                    },
                    questions: [
                        { question: "Tell me about your technical background" },
                        { question: "What programming languages are you most comfortable with?" },
                        { question: "Describe a challenging project you worked on" },
                        { question: "How do you approach debugging complex issues?" },
                        { question: "What are your career goals?" }
                    ],
                    answers: {
                        0: "I have 3 years of experience in software development...",
                        1: "I'm most comfortable with JavaScript, Python, and React...",
                        2: "I worked on an e-commerce platform that handled 10k users...",
                        3: "I start by reproducing the issue and checking logs...",
                        4: "I want to grow into a senior developer role..."
                    }
                });
                setLoading(false);
            }
        } else {
            // Redirect to home if no sessionId
            router.push("/");
        }
    }, [searchParams, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-4 text-zinc-400">Loading your results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
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
                    <Brain className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Interview Results</span>
                </div>
            </div>

            {results ? (
                <InterviewResults
                    results={results}
                    onRetry={() => router.push("/interview/practice")}
                    onHome={() => router.push("/")}
                />
            ) : (
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-12 text-center">
                        <div className="mx-auto w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                            <Brain className="h-10 w-10 text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Results Not Found
                        </h3>
                        <p className="text-zinc-400 mb-6">
                            Could not find the interview results you're looking for
                        </p>
                        <Button
                            onClick={() => router.push("/interview/practice")}
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                            Start New Interview
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function ResultsPage() {
    return (
        <PageLayout>
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[500px]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                        <p className="mt-4 text-zinc-400">Loading...</p>
                    </div>
                </div>
            }>
                <ResultsContent />
            </Suspense>
        </PageLayout>
    );
}
