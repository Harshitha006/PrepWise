"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle,
    TrendingUp,
    Target,
    Brain,
    ArrowLeft,
    Star,
    MessageSquare,
    Award,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface FeedbackPageProps {
    params: Promise<{ sessionId: string }>;
    searchParams: Promise<{ userId: string }>;
}

export default function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
    const { sessionId } = use(params);
    const { userId } = use(searchParams);
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (sessionId && userId) {
            fetchInterviewData();
        }
    }, [sessionId, userId]);

    const fetchInterviewData = async () => {
        try {
            const response = await fetch(`/api/get-interview?sessionId=${sessionId}&userId=${userId}`);
            const data = await response.json();

            if (data.success) {
                setInterview(data.session);
            } else {
                toast.error("Failed to load interview feedback");
            }
        } catch (error) {
            console.error("Error fetching feedback:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-zinc-400">Analyzing your performance...</p>
            </div>
        );
    }

    if (!interview || !interview.feedback) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-4">
                <h2 className="text-2xl font-bold text-white mb-4">Feedback Not Ready Yet</h2>
                <p className="text-zinc-400 mb-8">We're still processing your interview results.</p>
                <Button onClick={() => router.push("/")} variant="outline">Back to Dashboard</Button>
            </div>
        );
    }

    const { feedback } = interview;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Dashboard
                    </Button>
                    <div className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                        Interview Feedback • {interview.resumeData?.jobRole}
                    </div>
                </div>

                {/* Hero Score Section */}
                <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 p-8 md:p-12">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="relative">
                            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-8 border-zinc-800 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-5xl md:text-7xl font-black text-white">{feedback.overallScore}</span>
                                    <span className="block text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Overall Score</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl shadow-xl">
                                <Award className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">Great performance, <span className="text-blue-500">Candidate!</span></h1>
                            <p className="text-zinc-400 text-lg max-w-xl">{feedback.summary}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium">{interview.questions?.length} Questions</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium capitalize">{interview.difficulty} Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Strengths */}
                    <Card className="bg-zinc-900/50 border-emerald-500/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Star className="h-5 w-5 text-emerald-400" />
                                Key Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {feedback.strengths?.map((s: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                        <span className="text-sm text-zinc-300">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Improvements */}
                    <Card className="bg-zinc-900/50 border-blue-500/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <TrendingUp className="h-5 w-5 text-blue-400" />
                                Areas for Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {feedback.improvements?.map((im: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                        <span className="text-sm text-zinc-300">{im}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Question Feedback */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-purple-500" />
                        Question Analysis
                    </h2>
                    <div className="space-y-4">
                        {feedback.detailedFeedback?.map((df: any, i: number) => (
                            <Card key={i} className="bg-zinc-950 border-white/5 hover:border-white/10 transition-colors">
                                <CardHeader className="bg-zinc-900/30">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Question {i + 1}</span>
                                            <p className="text-lg font-bold text-white">{df.question}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-zinc-800 rounded-lg text-sm font-bold text-blue-400">
                                            {df.score}%
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Your Response</span>
                                        <p className="text-zinc-300 italic text-sm leading-relaxed p-4 bg-zinc-900 rounded-xl border border-white/5">
                                            "{df.answer}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block">Analysis</span>
                                            <p className="text-sm text-zinc-400">{df.critique}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">Better Way to Say It</span>
                                            <p className="text-sm text-zinc-300 bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg leading-relaxed">
                                                {df.betterVersion}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <div className="pt-8 pb-16 text-center">
                    <Button
                        onClick={() => router.push("/")}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 h-14 px-12 text-lg font-bold shadow-xl shadow-blue-900/20"
                    >
                        Start New Session
                    </Button>
                </div>
            </div>
        </div>
    );
}
