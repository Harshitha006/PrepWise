"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    Target,
    Brain,
    FileText,
    BookOpen,
    Clock,
    Star,
    MessageSquare,
    Zap,
    Loader2
} from "lucide-react";

interface DashboardProps {
    userId: string;
    sessionId?: string;
}

export default function Dashboard({ userId, sessionId }: DashboardProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const url = `/api/user-stats?userId=${userId}${sessionId ? `&sessionId=${sessionId}` : ""}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserStats();
    }, [userId, sessionId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-zinc-500">Loading your preparation dashboard...</p>
        </div>
    );

    if (!stats) return (
        <div className="text-center py-20">
            <p className="text-zinc-500 italic">No preparation data found. Start an interview to see your stats!</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Overall Performance</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.overallScore || 0}/100</div>
                        <Progress value={stats.overallScore || 0} className="mt-4 h-1.5 bg-zinc-800" />
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Resume ATS Score</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.atsScore || 0}/100</div>
                        <Progress value={stats.atsScore || 0} className="mt-4 h-1.5 bg-zinc-800" />
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Interviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.interviewCount || 0}</div>
                        <p className="text-xs text-zinc-500 mt-2">Sessions completed</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Skill Gaps Found</CardTitle>
                        <Target className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.skillGaps?.length || 0}</div>
                        <p className="text-xs text-zinc-500 mt-2">Areas for improvement</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill Gaps Detail */}
                <Card className="lg:col-span-2 bg-zinc-900/50 border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Target className="h-5 w-5 text-red-500" />
                            Skill Gap Analysis
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Identified weak areas from your resume and interview session
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.skillGaps?.length > 0 ? (
                                stats.skillGaps.map((gap: any, index: number) => (
                                    <div key={index} className="p-5 bg-zinc-800/30 border border-white/5 rounded-xl hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-zinc-200">{gap.skill}</h4>
                                            <div className="flex items-center gap-2 text-xs font-medium">
                                                <span className="text-zinc-500">{gap.currentLevel}</span>
                                                <TrendingUp className="h-3 w-3 text-zinc-600" />
                                                <span className="text-blue-400">{gap.requiredLevel}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-400 leading-relaxed mb-4">{gap.gapAnalysis}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {gap.resources?.map((resource: string, i: number) => (
                                                <span key={i} className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/10">
                                                    {resource}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-zinc-500 text-sm italic">No significant skill gaps identified yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-8">
                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white text-lg">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 h-12">
                                <BookOpen className="h-4 w-4" />
                                Review Learning Path
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5 h-12 text-zinc-300">
                                <Brain className="h-4 w-4" />
                                Retake Mock Interview
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5 h-12 text-zinc-300">
                                <FileText className="h-4 w-4" />
                                Update Resume & Rescore
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-zinc-400">Score Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Communication</span>
                                    <span className="text-zinc-300">{stats.communicationScore}%</span>
                                </div>
                                <Progress value={stats.communicationScore} className="h-1 bg-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Technical Skills</span>
                                    <span className="text-zinc-300">{stats.technicalScore}%</span>
                                </div>
                                <Progress value={stats.technicalScore} className="h-1 bg-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Confidence</span>
                                    <span className="text-zinc-300">{stats.confidenceScore}%</span>
                                </div>
                                <Progress value={stats.confidenceScore} className="h-1 bg-zinc-800" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
