"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import InterviewSetup from "@/components/InterviewSetup";
import EnhancedInterviewAgent from "@/components/EnhancedInterviewAgent";
import InterviewResults from "@/components/InterviewResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";

export default function InterviewPracticePage() {
    const [userId, setUserId] = useState<string>("");
    const [resumeData, setResumeData] = useState<any>(null);
    const [stage, setStage] = useState<"setup" | "interview" | "results">("setup");
    const [interviewConfig, setInterviewConfig] = useState<any>(null);
    const [interviewResults, setInterviewResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Get user data
        const localUserId = localStorage.getItem("userId") || `user_${Date.now()}`;
        setUserId(localUserId);
        localStorage.setItem("userId", localUserId);

        // Get resume data
        const savedResume = localStorage.getItem("resumeData");
        if (savedResume) {
            try {
                setResumeData(JSON.parse(savedResume));
            } catch (e) {
                console.error("Failed to parse resume data:", e);
            }
        }

        setLoading(false);
    }, []);

    const handleSetupComplete = (config: any) => {
        setInterviewConfig(config);
        setStage("interview");
    };

    const handleInterviewComplete = (results: any) => {
        setInterviewResults(results);

        // Save to history
        const history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
        history.push({
            ...results,
            date: new Date().toISOString(),
            config: interviewConfig
        });
        localStorage.setItem("interviewHistory", JSON.stringify(history));

        setStage("results");
    };

    const handleQuickStart = () => {
        // Quick start with default settings
        const quickConfig = {
            questionCount: 5,
            questionTypes: {
                technical: true,
                behavioral: true,
                scenario: false
            },
            difficulty: "medium",
            timePerQuestion: 30,
            focusAreas: []
        };

        setInterviewConfig(quickConfig);
        setStage("interview");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-4 text-zinc-400">Loading interview session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
            <Navbar />

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

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-400" />
                            <span className="text-sm font-medium text-blue-400">
                                {stage === "setup" ? "Interview Setup" :
                                    stage === "interview" ? "Live Interview" :
                                        "Interview Results"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {stage === "setup" && (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                {resumeData ? "Customize Your Interview" : "Start Practice Interview"}
                            </h1>
                            <p className="text-zinc-400 max-w-2xl mx-auto">
                                {resumeData
                                    ? `Practice interview for ${resumeData.jobRole} position`
                                    : "Configure your mock interview session"}
                            </p>
                        </div>

                        {resumeData ? (
                            <>
                                <Card className="mb-8 border-emerald-500/20 bg-emerald-500/5">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-emerald-300">
                                                    Using your resume analysis
                                                </h3>
                                                <p className="text-sm text-zinc-400">
                                                    Questions will be personalized for: {resumeData.jobRole}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-emerald-400">
                                                        {resumeData.atsScore}
                                                        <span className="text-sm text-zinc-500">/100</span>
                                                    </div>
                                                    <div className="text-xs text-zinc-400">ATS Score</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Quick Start Card */}
                                    <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/20">
                                        <CardHeader>
                                            <CardTitle className="text-white">Quick Start</CardTitle>
                                            <CardDescription className="text-zinc-400">
                                                5 questions • 10 minutes
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <ul className="space-y-2 text-sm text-zinc-400">
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    <span>3 technical questions</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    <span>2 behavioral questions</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    <span>30 seconds per question</span>
                                                </li>
                                            </ul>
                                            <Button
                                                onClick={handleQuickStart}
                                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                                            >
                                                Start Quick Interview
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Custom Interview Card */}
                                    <Card className="lg:col-span-2 border-purple-500/20 bg-gradient-to-br from-zinc-900/80 to-purple-900/20">
                                        <CardHeader>
                                            <CardTitle className="text-white">Custom Interview</CardTitle>
                                            <CardDescription className="text-zinc-400">
                                                Full customization options
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <InterviewSetup
                                                onStart={handleSetupComplete}
                                                onCancel={() => router.push("/")}
                                                defaultRole={resumeData.jobRole || "Software Developer"}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        ) : (
                            <Card className="border-amber-500/20 bg-gradient-to-br from-zinc-900/80 to-amber-500/5">
                                <CardContent className="p-8 text-center">
                                    <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                                        <Brain className="h-10 w-10 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Resume Not Found
                                    </h3>
                                    <p className="text-zinc-400 mb-6">
                                        For personalized interview questions, please upload your resume first
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button
                                            onClick={handleQuickStart}
                                            variant="outline"
                                        >
                                            Practice Without Resume
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/dashboard")}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                                        >
                                            Upload Resume First
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {stage === "interview" && interviewConfig && (
                    <EnhancedInterviewAgent
                        userId={userId}
                        config={interviewConfig}
                        resumeData={resumeData}
                        onComplete={handleInterviewComplete}
                    />
                )}

                {stage === "results" && interviewResults && (
                    <InterviewResults
                        results={interviewResults}
                        onRetry={() => setStage("setup")}
                        onHome={() => router.push("/")}
                    />
                )}
            </div>
        </div>
    );
}
