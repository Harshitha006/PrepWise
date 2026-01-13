"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import InterviewSetup from "@/components/InterviewSetup";
import EnhancedInterviewAgent from "@/components/EnhancedInterviewAgent";
import InterviewResults from "@/components/InterviewResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";

export default function InterviewNowPage() {
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

    if (loading) {
        return (
            <PageLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                        <p className="mt-4 text-zinc-400">Loading interview session...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
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
                                Configure Your Mock Interview
                            </h1>
                            <p className="text-zinc-400 max-w-2xl mx-auto">
                                Customize the interview based on your needs. You'll have thinking time before each answer.
                            </p>
                        </div>

                        {resumeData && (
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
                        )}

                        <InterviewSetup
                            onStart={handleSetupComplete}
                            onCancel={() => router.push("/")}
                            defaultRole={resumeData?.jobRole || "Software Developer"}
                        />
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
        </PageLayout>
    );
}
