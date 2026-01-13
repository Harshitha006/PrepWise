"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InterviewAgent from "@/components/InterviewAgent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Brain } from "lucide-react";

interface InterviewSessionClientProps {
    sessionId: string;
    userId: string;
}

export default function InterviewSessionClient({ sessionId, userId }: InterviewSessionClientProps) {
    const [loading, setLoading] = useState(true);
    const [resumeData, setResumeData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        loadInterviewData();
    }, [sessionId, userId]);

    const loadInterviewData = async () => {
        try {
            // Load resume data first
            const statsResponse = await fetch(`/api/user-stats?userId=${userId}`);
            const statsData = await statsResponse.json();

            if (statsData.success) {
                setResumeData(statsData.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to load interview data:", error);
            setLoading(false);
        }
    };

    const handleInterviewComplete = async (results: any) => {
        console.log("Interview completed:", results);

        // Save results
        try {
            const response = await fetch("/api/save-interview-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    sessionId: results.sessionId,
                    answers: results.answers,
                    questions: results.questions,
                    completedAt: results.completedAt
                })
            });

            if (response.ok) {
                // Redirect to results/feedback page
                router.push(`/interview/feedback/${results.sessionId}?userId=${userId}`);
            }
        } catch (error) {
            console.error("Failed to save results:", error);
            router.push(`/interview/feedback/${results.sessionId}?userId=${userId}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <Loader2 className="animate-spin h-16 w-16 text-blue-500 mx-auto" />
                    <p className="mt-4 text-zinc-400 font-medium">Preparing your AI interview coach...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        onClick={() => router.push("/")}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Exit Session
                    </Button>

                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <Brain className="h-5 w-5 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Live Mock Interview</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-12">
                    {/* Instructions Card */}
                    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-900/30 via-zinc-900 to-zinc-900 p-1">
                        <div className="bg-zinc-900 rounded-[calc(var(--radius)-1px)] p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Interview Instructions</h2>
                                    <p className="text-zinc-400 text-sm">Follow these pro-tips for the best practice experience</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                    <div className="flex items-center gap-2 text-zinc-300 text-xs">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Speak clearly. Use the STAR method.
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-300 text-xs">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Ask for hints if you're stuck.
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-300 text-xs">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Natural transitions are encouraged.
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-300 text-xs">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Focus on quantifiable achievements.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Interview Agent */}
                    <InterviewAgent
                        userId={userId}
                        sessionId={sessionId}
                        questions={[]}
                        resumeData={resumeData}
                        onComplete={handleInterviewComplete}
                    />
                </div>
            </div>
        </div>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
        </svg>
    )
}
