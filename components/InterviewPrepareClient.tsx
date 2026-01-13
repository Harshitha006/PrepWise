"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Brain,
    Target,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface InterviewPrepareClientProps {
    userId: string;
    resumeId?: string;
}

export default function InterviewPrepareClient({ userId, resumeId }: InterviewPrepareClientProps) {
    const [resumeData, setResumeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [preparing, setPreparing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (userId) {
            fetchResumeData();
        }
    }, [userId, resumeId]);

    const fetchResumeData = async () => {
        try {
            let url = `/api/user-stats?userId=${userId}`;
            const statsResponse = await fetch(url);
            const statsData = await statsResponse.json();

            if (statsData.success) {
                setResumeData(statsData.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const startMockInterview = async () => {
        if (!userId) {
            toast.error("User ID is missing");
            return;
        }

        setPreparing(true);

        try {
            // Generate interview questions
            toast.info("Generating personalized interview questions...");

            const response = await fetch("/api/generate-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    resumeData: resumeData, // Pass latest stats/resume analysis
                    difficulty: "mixed",
                    questionCount: 8
                })
            });

            const data = await response.json();

            if (data.success && data.sessionId) {
                toast.success("Interview session ready!");
                router.push(`/interview/session/${data.sessionId}?userId=${userId}`);
            } else {
                throw new Error(data.error || "Failed to generate interview");
            }
        } catch (error: any) {
            console.error("Start interview error:", error);
            toast.error("Failed to start interview", {
                description: error.message || "Please try again"
            });
        } finally {
            setPreparing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
                    <p className="mt-4 text-zinc-400">Analyzing your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                    Interview Preparation
                </h1>
                <p className="text-zinc-400">
                    Personalized mock interview based on your resume analysis
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gradient-to-br from-zinc-900/80 to-blue-900/20 border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Brain className="h-5 w-5 text-blue-400" />
                            Your Resume Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {resumeData && resumeData.hasResume ? (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-blue-300">
                                                {resumeData.preferredRole}
                                            </h3>
                                            <p className="text-sm text-zinc-400">Target position</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-emerald-400">
                                                {resumeData.atsScore}/100
                                            </div>
                                            <div className="text-xs text-zinc-500">ATS Score</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium text-white">Key Skills for Interview</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {resumeData.skills?.slice(0, 10).map((skill: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-300 rounded-lg text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 p-8 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                                <AlertCircle className="h-10 w-10 text-amber-500" />
                                <div>
                                    <h3 className="font-bold text-amber-500">No Resume Found</h3>
                                    <p className="text-zinc-400 text-sm mt-1">Please upload your resume in the dashboard first to get personalized questions.</p>
                                </div>
                                <Button onClick={() => router.push("/")} variant="outline" className="mt-2 border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                                    Go to Dashboard
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-900/80 to-purple-900/20 border-purple-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Target className="h-5 w-5 text-purple-400" />
                            Session Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                <h4 className="font-medium text-white mb-2">Focus Areas</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Technical implementation & Architecture
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Behavioral & Leadership scenarios
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Problem-solving across your tech stack
                                    </li>
                                </ul>
                            </div>

                            <Button
                                onClick={startMockInterview}
                                disabled={preparing || !resumeData?.hasResume}
                                className="w-full h-15 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg font-bold shadow-xl shadow-blue-500/20 group transition-all"
                            >
                                {preparing ? (
                                    <>
                                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                        Generating Session...
                                    </>
                                ) : (
                                    <>
                                        Start Mock Interview
                                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
