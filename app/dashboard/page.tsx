"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import ResumeUploader from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    History,
    Upload,
    RefreshCw,
    Trash2,
    LogOut
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [userId, setUserId] = useState<string>("");
    const [resumeHistory, setResumeHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("upload");
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setUserId(user.uid);
        }
        loadResumeHistory();
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/sign-in");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const loadResumeHistory = () => {
        try {
            const savedResume = localStorage.getItem("resumeData");
            if (savedResume) {
                const resumeData = JSON.parse(savedResume);
                setResumeHistory([{
                    id: "current",
                    date: new Date().toISOString(),
                    data: resumeData,
                    atsScore: resumeData.atsScore || 0,
                    jobRole: resumeData.jobRole || "Not specified"
                }]);
            }
        } catch (error) {
            console.error("Error loading resume history:", error);
        }
    };

    const handleAnalysisComplete = (data: any) => {
        if (data.analysis) {
            // Save to localStorage
            localStorage.setItem("resumeData", JSON.stringify(data.analysis));

            // Update history
            loadResumeHistory();

            toast.success("Resume Analyzed!", {
                description: "Your resume has been analyzed and saved.",
                duration: 3000
            });

            // Switch to history tab
            setActiveTab("history");
        }
    };

    const handleDeleteResume = (id: string) => {
        if (id === "current") {
            localStorage.removeItem("resumeData");
            setResumeHistory([]);
            toast.success("Resume Deleted", {
                description: "Your resume data has been removed.",
                duration: 3000
            });
        }
    };

    const handleUseResume = (resume: any) => {
        localStorage.setItem("resumeData", JSON.stringify(resume.data));
        toast.success("Resume Loaded", {
            description: "Using this resume for interviews.",
            duration: 2000
        });
        router.push("/");
    };

    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header with User Profile & Logout */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Dashboard
                        </h1>
                        {user && (
                            <p className="text-zinc-400">
                                Welcome back, <span className="text-blue-400 font-medium">{user.displayName || user.email}</span>
                            </p>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        className="border-zinc-700 hover:bg-red-500/10 hover:text-red-400 font-medium transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload & Analyze
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Resume History
                        </TabsTrigger>
                    </TabsList>

                    {/* Upload Tab */}
                    <TabsContent value="upload" className="space-y-6">
                        <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Upload className="h-5 w-5 text-blue-400" />
                                    Upload New Resume
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Upload a PDF or paste text to get ATS score and personalized interview questions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResumeUploader
                                    userId={userId}
                                    onAnalysisComplete={handleAnalysisComplete}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-6">
                        {resumeHistory.length > 0 ? (
                            <>
                                <Card className="border-purple-500/20 bg-gradient-to-br from-zinc-900/80 to-purple-900/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white">
                                            <History className="h-5 w-5 text-purple-400" />
                                            Your Resume History
                                        </CardTitle>
                                        <CardDescription className="text-zinc-400">
                                            Previously analyzed resumes
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {resumeHistory.map((resume: any) => (
                                                <Card key={resume.id} className="bg-zinc-900/50 border-zinc-800">
                                                    <CardContent className="p-6">
                                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                                                        <FileText className="h-5 w-5 text-purple-400" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-semibold text-white">{resume.jobRole}</h3>
                                                                        <p className="text-sm text-zinc-400">
                                                                            Analyzed on {new Date(resume.date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-center">
                                                                        <div className="text-2xl font-bold text-emerald-400">
                                                                            {resume.atsScore}
                                                                            <span className="text-sm text-zinc-500">/100</span>
                                                                        </div>
                                                                        <div className="text-xs text-zinc-400">ATS Score</div>
                                                                    </div>

                                                                    <div className="text-center">
                                                                        <div className="text-2xl font-bold text-blue-400">
                                                                            {resume.data?.skills?.length || 0}
                                                                        </div>
                                                                        <div className="text-xs text-zinc-400">Skills</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => handleUseResume(resume)}
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                                    Use This
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteResume(resume.id)}
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
                                    </CardContent>
                                </Card>

                                <div className="text-center">
                                    <Button
                                        onClick={() => setActiveTab("upload")}
                                        variant="outline"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload New Resume
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Card className="border-zinc-800 bg-zinc-900/50">
                                <CardContent className="p-12 text-center">
                                    <div className="mx-auto w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                        <FileText className="h-10 w-10 text-zinc-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        No Resume History
                                    </h3>
                                    <p className="text-zinc-400 mb-6">
                                        You haven't analyzed any resumes yet
                                    </p>
                                    <Button
                                        onClick={() => setActiveTab("upload")}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Your First Resume
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    );
}
