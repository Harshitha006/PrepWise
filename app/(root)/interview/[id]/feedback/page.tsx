import { getFeedbackByInterviewId, getInterviewById } from "@/lib/actions/general.action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";

export default async function FeedbackPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const [feedback, interview] = await Promise.all([
        getFeedbackByInterviewId(id),
        getInterviewById(id),
    ]);

    if (!feedback) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold">Feedback not found</h2>
                <p className="text-zinc-500">The feedback for this interview hasn't been generated yet.</p>
                <Link href="/">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const sections = feedback.categoryScores || [];

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-100">{interview?.role} - Feedback</h1>
                    <p className="text-zinc-500">
                        Interview taken on {dayjs(feedback.createdAt).format("MMMM DD, YYYY")}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full border-4 border-purple-500/20 flex flex-col items-center justify-center bg-zinc-900 shadow-2xl shadow-purple-500/20">
                        <span className="text-2xl font-bold text-purple-400">{feedback.totalScore}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Score</span>
                    </div>
                    <Link href={`/interview/${id}`}>
                        <Button className="bg-zinc-800 hover:bg-zinc-700 border border-white/5">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retake Interview
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Hero Feedback */}
            <Card className="bg-gradient-to-br from-zinc-900 to-black border-white/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/5 blur-[80px]" />
                <CardHeader>
                    <CardTitle className="text-zinc-200">Overall Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-zinc-300 leading-relaxed italic">
                        "{feedback.finalAssessment}"
                    </p>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-zinc-200 px-1">Performance Details</h2>
                    {sections.map((section: { name: string, score: number, comment: string }, idx: number) => (
                        <Card key={idx} className="bg-zinc-900/50 border-white/5">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-zinc-300">{section.name}</span>
                                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-none">
                                        {section.score}/100
                                    </Badge>
                                </div>
                                <Progress value={section.score} className="h-1.5 bg-zinc-800 [&>div]:bg-purple-500" />
                                <p className="text-sm text-zinc-500 leading-relaxed italic">"{section.comment}"</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-zinc-200 px-1">Detailed Analysis</h2>

                    <Card className="bg-green-500/5 border-green-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-green-400">
                                <CheckCircle2 className="h-5 w-5" />
                                Key Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {feedback.strengths.map((s: string, i: number) => (
                                    <li key={i} className="text-sm text-zinc-400 border-l-2 border-green-500/30 pl-3 py-1">
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-500/5 border-yellow-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-yellow-400">
                                <AlertCircle className="h-5 w-5" />
                                Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {feedback.areasForImprovement.map((a: string, i: number) => (
                                    <li key={i} className="text-sm text-zinc-400 border-l-2 border-yellow-500/30 pl-3 py-1">
                                        {a}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
