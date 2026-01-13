"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    History,
    Calendar,
    Clock,
    TrendingUp,
    Trash2,
    Eye
} from "lucide-react";
import { toast } from "sonner";

export default function HistoryPage() {
    const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        try {
            const history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
            setInterviewHistory(history.reverse()); // Show newest first
        } catch (error) {
            console.error("Error loading history:", error);
        }
    };

    const handleViewDetails = (interview: any) => {
        // Navigate to results page
        router.push(`/interview/results?sessionId=${interview.sessionId || interview.date}`);
    };

    const handleDeleteItem = (index: number) => {
        const newHistory = [...interviewHistory];
        newHistory.splice(index, 1);
        setInterviewHistory(newHistory);
        localStorage.setItem("interviewHistory", JSON.stringify(newHistory.reverse()));

        toast.success("Deleted", {
            description: "Interview removed from history.",
            duration: 3000
        });
    };

    const handleClearHistory = () => {
        if (confirm("Are you sure you want to clear all interview history?")) {
            setInterviewHistory([]);
            localStorage.removeItem("interviewHistory");
            localStorage.removeItem("interviews");

            toast.success("History Cleared", {
                description: "All interview history has been removed.",
                duration: 3000
            });
        }
    };

    return (
        <PageLayout>
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                        <History className="h-8 w-8 text-purple-400" />
                        Interview History
                    </h1>
                    <p className="text-zinc-400">
                        View your past interview performances and track progress
                    </p>
                </div>

                {interviewHistory.length > 0 ? (
                    <>
                        {/* Stats Summary */}
                        <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/20 mb-8">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-emerald-400">
                                            {interviewHistory.length}
                                        </div>
                                        <div className="text-sm text-zinc-400">Total Interviews</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-400">
                                            {Math.round(interviewHistory.reduce((sum, item) =>
                                                sum + (item.analysis?.overallScore || 0), 0) / interviewHistory.length) || 0}
                                            <span className="text-lg text-zinc-500">/100</span>
                                        </div>
                                        <div className="text-sm text-zinc-400">Average Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-400">
                                            {new Date(interviewHistory[0]?.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-zinc-400">Last Practice</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interview List */}
                        <div className="space-y-6">
                            {interviewHistory.map((interview, index) => (
                                <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                                        <Calendar className="h-5 w-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">
                                                            Interview on {new Date(interview.date).toLocaleDateString()}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-4 w-4" />
                                                                {new Date(interview.date).toLocaleTimeString()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <TrendingUp className="h-4 w-4" />
                                                                {interview.analysis?.overallScore || 0}/100
                                                            </span>
                                                            <span>
                                                                {interview.questions?.length || 0} questions
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-emerald-400">
                                                            {interview.analysis?.overallScore || 0}
                                                            <span className="text-sm text-zinc-500">/100</span>
                                                        </div>
                                                        <div className="text-xs text-zinc-400">Overall</div>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-blue-400">
                                                            {interview.analysis?.technicalScore || 0}
                                                            <span className="text-sm text-zinc-500">/100</span>
                                                        </div>
                                                        <div className="text-xs text-zinc-400">Technical</div>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-purple-400">
                                                            {interview.analysis?.communicationScore || 0}
                                                            <span className="text-sm text-zinc-500">/100</span>
                                                        </div>
                                                        <div className="text-xs text-zinc-400">Communication</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleViewDetails(interview)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteItem(index)}
                                                    variant="destructive"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Clear History Button */}
                        <div className="text-center mt-8">
                            <Button
                                onClick={handleClearHistory}
                                variant="destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear All History
                            </Button>
                        </div>
                    </>
                ) : (
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                <History className="h-10 w-10 text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                No Interview History
                            </h3>
                            <p className="text-zinc-400 mb-6">
                                You haven't completed any interviews yet
                            </p>
                            <Button
                                onClick={() => router.push("/interview/now")}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                Start Your First Interview
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
}
