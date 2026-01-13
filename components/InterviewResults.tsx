"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    CheckCircle,
    RefreshCw,
    Home,
    Download,
    Share2,
    TrendingUp,
    MessageSquare,
    Zap,
    Target
} from "lucide-react";

interface InterviewResultsProps {
    results: any;
    onRetry: () => void;
    onHome: () => void;
}

export default function InterviewResults({ results, onRetry, onHome }: InterviewResultsProps) {
    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        // If results already has analysis, use it
        if (results.analysis) {
            setAnalysis(results.analysis);
        } else {
            // Otherwise simulate analysis for now (in real app, this would be an API call)
            const mockAnalysis = {
                overallScore: 82,
                technicalScore: 78,
                communicationScore: 85,
                confidenceScore: 88,
                strengths: ["Clear communication", "Good technical understanding", "Confident delivery"],
                improvements: ["Provide more specific examples", "Go deeper into technical details"],
                detailedFeedback: "You demonstrated strong communication skills and handled the questions well. To improve, try to be more specific with your technical examples."
            };
            setAnalysis(mockAnalysis);
        }
    }, [results]);

    if (!analysis) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-zinc-400">Analyzing your performance...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Score Header */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/10">
                <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-full mb-6 relative">
                        <TrendingUp className="h-10 w-10 text-blue-400" />
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-20"></div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">Great Job!</h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                        You've completed the interview session. Here's a breakdown of your performance.
                    </p>

                    <div className="flex justify-center items-end gap-2 mb-2">
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {analysis.overallScore}
                        </span>
                        <span className="text-xl text-zinc-500 font-medium mb-3">/100</span>
                    </div>
                    <div className="text-sm font-medium text-blue-400 uppercase tracking-widest">
                        Overall Performance Score
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Technical
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analysis.technicalScore}/100</div>
                        <Progress value={analysis.technicalScore} className="mt-2 h-2 bg-zinc-800" />
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-500" />
                            Communication
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analysis.communicationScore}/100</div>
                        <Progress value={analysis.communicationScore} className="mt-2 h-2 bg-zinc-800" />
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-500" />
                            Confidence
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analysis.confidenceScore}/100</div>
                        <Progress value={analysis.confidenceScore} className="mt-2 h-2 bg-zinc-800" />
                    </CardContent>
                </Card>
            </div>

            {/* Feedback Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-emerald-400 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Key Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {analysis.strengths?.map((strength: string, i: number) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></div>
                                    <span className="text-zinc-300">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-amber-400 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {analysis.improvements?.map((area: string, i: number) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></div>
                                    <span className="text-zinc-300">{area}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button
                    onClick={onRetry}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Practice Again
                </Button>

                <Button
                    onClick={onHome}
                    size="lg"
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                >
                    <Home className="mr-2 h-5 w-5" />
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
}
