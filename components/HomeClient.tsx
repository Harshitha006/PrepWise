"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Brain,
    Target,
    TrendingUp,
    FileText,
    AlertCircle,
    ArrowRight,
    Upload,
    Star,
    MessageSquare,
    Zap,
    Clock,
    Settings,
    RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface HomeClientProps {
    userId: string;
}

export default function HomeClient({ userId }: HomeClientProps) {
    const { user } = useAuth();
    const [userStats, setUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasResume, setHasResume] = useState(false);
    const [showInterviewOptions, setShowInterviewOptions] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkLocalResume();
    }, []);

    const checkLocalResume = () => {
        const resumeData = localStorage.getItem("resumeData");
        const interviews = JSON.parse(localStorage.getItem("interviews") || "[]");

        const stats = {
            hasResume: !!resumeData,
            atsScore: resumeData ? JSON.parse(resumeData).atsScore || 0 : 0,
            interviewCount: interviews.length,
            skills: resumeData ? JSON.parse(resumeData).skills || [] : [],
            preferredRole: resumeData ? JSON.parse(resumeData).jobRole || "Not set" : "Not set",
            experience: resumeData ? JSON.parse(resumeData).experience || "Not specified" : "Not specified"
        };

        setUserStats(stats);
        setHasResume(!!resumeData);
        setLoading(false);
    };

    const handleStartQuickInterview = () => {
        if (!hasResume) {
            toast.error("Resume Required", {
                description: "Please upload your resume first for personalized interview preparation",
                duration: 4000,
                action: {
                    label: "Upload Resume",
                    onClick: () => router.push("/dashboard")
                }
            });
            return;
        }

        // Navigate to quick interview page
        router.push("/interview/quick");
    };

    const handleStartCustomInterview = () => {
        if (!hasResume) {
            toast.error("Resume Required", {
                description: "Please upload your resume first for personalized interview preparation",
                duration: 4000,
                action: {
                    label: "Upload Resume",
                    onClick: () => router.push("/dashboard")
                }
            });
            return;
        }

        // Navigate to practice page (will show setup)
        router.push("/interview/practice");
    };

    const handleUploadResume = () => {
        router.push("/dashboard"); // Updated
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-zinc-400">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Welcome, <span className="text-blue-400">{user?.displayName || user?.email?.split("@")[0] || "User"}</span>!
                        </h1>
                        <p className="text-zinc-300 max-w-2xl">
                            {hasResume
                                ? `Ready for interview practice as a ${userStats?.preferredRole || "Software Developer"}`
                                : "Upload your resume to get started with AI-powered interview preparation."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {!hasResume ? (
                            <Button
                                onClick={handleUploadResume}
                                size="lg"
                                className="h-12 px-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Resume
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowInterviewOptions(!showInterviewOptions)}
                                size="lg"
                                className="h-12 px-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                <Brain className="mr-2 h-4 w-4" />
                                Start Interview
                            </Button>
                        )}

                        {hasResume && (
                            <Button
                                onClick={handleUploadResume}
                                variant="outline"
                                size="lg"
                                className="h-12 px-6 rounded-full"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                New Resume
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Interview Options Popup */}
            {showInterviewOptions && (
                <Card className="border-purple-500/20 bg-gradient-to-br from-zinc-900/80 to-purple-900/20 animate-in fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Settings className="h-5 w-5 text-purple-400" />
                            Choose Interview Type
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Select how you want to practice
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Button
                                onClick={handleStartQuickInterview}
                                className="h-24 flex-col gap-3 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Brain className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">Quick Practice</div>
                                        <div className="text-sm text-zinc-400">5 questions • 10 minutes</div>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 text-center">
                                    Fast practice session with common questions
                                </p>
                            </Button>

                            <Button
                                onClick={handleStartCustomInterview}
                                className="h-24 flex-col gap-3 bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Settings className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">Custom Interview</div>
                                        <div className="text-sm text-zinc-400">Fully customizable</div>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 text-center">
                                    Choose questions, time, and difficulty
                                </p>
                            </Button>
                        </div>

                        <div className="flex justify-center mt-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowInterviewOptions(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {hasResume ? `${userStats?.atsScore || 0}/100` : "--/100"}
                        </div>
                        <Progress
                            value={hasResume ? userStats?.atsScore || 0 : 0}
                            className="mt-2 h-2"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            {hasResume ? "Resume compatibility" : "Upload resume to get score"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{userStats?.interviewCount || 0}</div>
                        <p className="text-xs text-zinc-500">Mock interviews completed</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Skills</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {hasResume ? userStats?.skills?.length || 0 : "--"}
                        </div>
                        <p className="text-xs text-zinc-500">Identified from resume</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Target Role</CardTitle>
                        <Target className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white truncate">
                            {hasResume ? userStats?.preferredRole || "Not set" : "Not set"}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                            {hasResume ? "AI recommended position" : "Upload resume for analysis"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Resume Analysis/Upload */}
                <Card className="bg-gradient-to-br from-zinc-900/80 to-blue-900/20 border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FileText className="h-5 w-5 text-blue-400" />
                            {hasResume ? "Your Resume Analysis" : "Resume Status"}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            {hasResume
                                ? "AI analysis of your resume is complete"
                                : "Start by uploading your resume for personalized interview prep"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {hasResume ? (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">ATS Compatibility</span>
                                        <span className={`text-lg font-bold ${(userStats?.atsScore || 0) >= 70 ? 'text-emerald-400' : (userStats?.atsScore || 0) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {userStats?.atsScore || 0}/100
                                        </span>
                                    </div>
                                    <Progress
                                        value={userStats?.atsScore || 0}
                                        className="h-3"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium text-white">Top Skills Identified</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {userStats?.skills?.slice(0, 6).map((skill: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-300 rounded-lg text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium text-white">Target Role</h4>
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <p className="text-lg font-semibold text-blue-300">{userStats?.preferredRole}</p>
                                        <p className="text-sm text-zinc-400 mt-1">
                                            Based on {userStats?.experience || "your"} experience
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => router.push("/dashboard")}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Details
                                    </Button>
                                    <Button
                                        onClick={handleUploadResume}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        New Resume
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Upload className="h-10 w-10 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        No Resume Found
                                    </h3>
                                    <p className="text-zinc-400">
                                        Upload your resume to enable personalized interview preparation
                                    </p>
                                </div>
                                <Button
                                    onClick={handleUploadResume}
                                    className="w-full h-12"
                                    size="lg"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Resume Now
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Quick Actions */}
                <Card className="bg-gradient-to-br from-zinc-900/80 to-purple-900/20 border-purple-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Brain className="h-5 w-5 text-purple-400" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Start practicing or manage your profile
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleStartQuickInterview}
                                disabled={!hasResume}
                                className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 disabled:opacity-50"
                            >
                                <Brain className="h-6 w-6 text-blue-400" />
                                <div className="text-sm font-medium">Quick Interview</div>
                                <div className="text-xs text-zinc-400">5 min</div>
                            </Button>

                            <Button
                                onClick={handleStartCustomInterview}
                                disabled={!hasResume}
                                className="h-20 flex-col gap-2 bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40 disabled:opacity-50"
                            >
                                <Settings className="h-6 w-6 text-purple-400" />
                                <div className="text-sm font-medium">Custom Interview</div>
                                <div className="text-xs text-zinc-400">Customize</div>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-white">Practice Areas</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-zinc-300">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Technical questions on your skills
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    Behavioral scenarios
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    Real-time voice interaction
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    Instant feedback analysis
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-white">Recent Activity</h4>
                            <div className="text-sm text-zinc-400 space-y-2">
                                {userStats?.interviewCount > 0 ? (
                                    <>
                                        <p>✓ {userStats.interviewCount} interviews completed</p>
                                        <p>✓ Resume analyzed with {userStats.atsScore}/100 ATS score</p>
                                        <p>✓ {userStats.skills?.length || 0} skills identified</p>
                                    </>
                                ) : (
                                    <p className="text-zinc-500">No interviews completed yet</p>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleUploadResume}
                            variant="outline"
                            className="w-full"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {hasResume ? "Upload New Resume" : "Upload Resume"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                                {hasResume ? userStats?.atsScore || 0 : "--"}
                            </div>
                            <div className="text-xs text-zinc-400">ATS Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {userStats?.interviewCount || 0}
                            </div>
                            <div className="text-xs text-zinc-400">Interviews</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">
                                {hasResume ? userStats?.skills?.length || 0 : "--"}
                            </div>
                            <div className="text-xs text-zinc-400">Skills</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-400">
                                {hasResume ? "✓" : "--"}
                            </div>
                            <div className="text-xs text-zinc-400">Resume</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
