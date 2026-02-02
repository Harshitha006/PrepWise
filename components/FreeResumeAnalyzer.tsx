"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Sparkles, AlertCircle, Star, Zap, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function FreeResumeAnalyzer() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setProgress(0);

        // Simulate progress for better UX
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 80) {
                    clearInterval(interval);
                    return 80;
                }
                return prev + 10;
            });
        }, 300);

        try {
            const formData = new FormData();
            formData.append("resume", file);

            const response = await fetch("/api/resume/analyze-free", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval);
            setProgress(100);

            const data = await response.json();

            if (data.success) {
                setResult(data.data);

                // Save to localStorage
                localStorage.setItem("lastResumeAnalysis", JSON.stringify(data.data));

                toast.success(`Free Analysis Complete! Score: ${data.data.atsScore.score}/100`);
            } else {
                toast.error(data.error || "Analysis failed");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
            }, 1000);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Needs Work";
    };

    const getBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
        if (score >= 80) return "default";
        if (score >= 60) return "secondary";
        return "destructive";
    };

    return (
        <div className="space-y-8">
            {/* Free Tier Banner */}
            <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/30">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-900/50">
                            <Shield className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">Free Resume Analysis</h3>
                            <p className="text-sm text-zinc-400">
                                Get instant ATS compatibility score and basic insights. No credit card required.
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-xs">
                                <span className="flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-green-400" />
                                    <span>100% Free</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Target className="h-3 w-3 text-blue-400" />
                                    <span>Basic ATS Scoring</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-purple-400" />
                                    <span>Skill Detection</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Area */}
            <Card
                className={`border-2 ${dragOver ? 'border-green-500 bg-emerald-950/10' : 'border-dashed border-zinc-700'} transition-all duration-200`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === "application/pdf") {
                        handleFileUpload(file);
                    } else {
                        toast.error("Please upload a PDF file");
                    }
                }}
            >
                <CardContent className="p-8">
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-900/30 to-blue-900/30 flex items-center justify-center">
                            <Upload className="h-10 w-10 text-emerald-400" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-2">Upload Your Resume</h3>
                            <p className="text-zinc-400">
                                Get a free ATS compatibility score and improvement suggestions
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                            }}
                        />

                        <div className="space-y-4">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                size="lg"
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 px-8"
                            >
                                {uploading ? (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Choose PDF File
                                    </>
                                )}
                            </Button>

                            <p className="text-sm text-zinc-500">
                                Drag & drop PDF or click to browse
                            </p>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div className="text-center">
                                    <div className="font-semibold">100% Free</div>
                                    <div className="text-zinc-500">No credit card</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold">PDF Only</div>
                                    <div className="text-zinc-500">Max 2MB</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold">Instant Results</div>
                                    <div className="text-zinc-500">10s analysis</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold">Basic Analysis</div>
                                    <div className="text-zinc-500">ATS + Skills</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress */}
            {uploading && (
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
                                    Analyzing your resume...
                                </span>
                                <span className="font-mono">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-zinc-500">
                                Using free AI analysis. This may take a few seconds.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Score Card */}
                    <Card className="border-emerald-800/30 bg-gradient-to-br from-emerald-950/10 to-blue-950/10">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`text-5xl font-bold ${getScoreColor(result.atsScore.score)}`}>
                                            {result.atsScore.score}
                                        </div>
                                        <div>
                                            <Badge variant={getBadgeVariant(result.atsScore.score)}>
                                                {getScoreBadge(result.atsScore.score)}
                                            </Badge>
                                            <div className="text-sm text-zinc-400 mt-1">out of 100</div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-sm">
                                        ATS Compatibility Score • {result.atsScore.grade} Grade
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {Object.entries(result.atsScore.breakdown).map(([key, value]: [string, any]) => (
                                        <div key={key} className="text-center p-3 bg-zinc-900/50 rounded-lg">
                                            <div className="text-xl font-semibold">{value}</div>
                                            <div className="text-xs text-zinc-400 capitalize mt-1">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-emerald-400" />
                                    Detected Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {result.insights?.strengths?.map((strength: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 p-2 bg-emerald-900/10 rounded">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-sm">{strength}</span>
                                        </li>
                                    ))}
                                    {(!result.insights?.strengths || result.insights.strengths.length === 0) && (
                                        <li className="text-sm text-zinc-500">No specific strengths detected</li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Improvements */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                                    Suggested Improvements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {result.insights?.improvements?.map((improvement: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 p-2 bg-yellow-900/10 rounded">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                                            <span className="text-sm">{improvement}</span>
                                        </li>
                                    ))}
                                    {result.atsScore?.feedback?.map((feedback: string, i: number) => (
                                        <li key={`fb-${i}`} className="flex items-start gap-3 p-2 bg-yellow-900/10 rounded">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                                            <span className="text-sm">{feedback}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Suggested Roles */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Suggested Roles</CardTitle>
                                <CardDescription>Based on detected skills</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {result.insights?.suggestedRoles?.map((role: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                                            <span className="font-medium">{role}</span>
                                            <Badge variant="outline">Good Fit</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Key Skills */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Key Skills Detected</CardTitle>
                                <CardDescription>Automatically identified from your resume</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {result.insights?.keySkills?.map((skill: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="px-3 py-1">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {result.structured?.skills?.map((skill: string, i: number) => (
                                        <Badge key={`struct-${i}`} variant="outline" className="px-3 py-1">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Free Tier Limitations Notice */}
                    <Card className="border-yellow-800/30 bg-yellow-950/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                <div className="text-sm">
                                    <span className="font-medium">Free Tier Limitations:</span>
                                    <span className="text-zinc-400 ml-2">
                                        Basic analysis only. Upgrade for advanced parsing, job matching, and personalized coaching.
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {!result && !uploading && (
                <Card className="border-zinc-800">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto max-w-sm space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-zinc-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">No Resume Analyzed Yet</h3>
                                <p className="text-sm text-zinc-400">
                                    Upload a PDF resume to get your free ATS compatibility score
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
