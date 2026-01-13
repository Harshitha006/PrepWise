"use client";
import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Brain, Target, TrendingUp, Sparkles, Lightbulb, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ResumeUploaderProps {
    userId: string;
    onAnalysisComplete: (data: any) => void;
}

export default function ResumeUploader({ userId, onAnalysisComplete }: ResumeUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [jobRecommendations, setJobRecommendations] = useState<string>("");
    const [interviewQuestions, setInterviewQuestions] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextSubmit = async () => {
        if (!textInput.trim() || textInput.length < 50) {
            toast.error("Please enter at least 50 characters of resume text");
            return;
        }

        setIsUploading(true);
        setError(null);
        console.log("=== STARTING AI RESUME ANALYSIS ===");

        try {
            const response = await fetch("/api/upload-resume", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    resumeText: textInput,
                    userId
                })
            });

            const data = await response.json();
            console.log("API Response:", data);

            if (data.success) {
                console.log("Analysis data received:", data.analysis);
                setAnalysis(data.analysis);
                setJobRecommendations(data.jobRecommendations || "");
                setInterviewQuestions(data.interviewQuestions || "");

                toast.success(data.message || "Analysis complete!", {
                    description: `Using ${data.debug?.source || "enhanced"} analysis`,
                    duration: 4000
                });

                // Save to localStorage for immediate access
                localStorage.setItem("resumeData", JSON.stringify(data.analysis));
                localStorage.setItem("userId", userId);

                onAnalysisComplete(data);
            } else {
                console.error("API returned error:", data.error);
                setError(data.error || "Analysis failed");
                toast.error(data.error || "Analysis failed. Please try again.");
            }
        } catch (error: any) {
            console.error("Fetch error:", error);
            setError(error.message || "Network error");
            toast.error("Analysis failed. Please check console for details.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("resume", file);
            formData.append("userId", userId);

            const response = await fetch("/api/upload-resume", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            console.log("File upload response:", data);

            if (data.success) {
                setAnalysis(data.analysis);
                setJobRecommendations(data.jobRecommendations || "");
                setInterviewQuestions(data.interviewQuestions || "");

                toast.success(data.message || "File analyzed successfully!", {
                    description: `Using ${data.debug?.source || "enhanced"} analysis`,
                    duration: 4000
                });

                // Save to localStorage for immediate access
                localStorage.setItem("resumeData", JSON.stringify(data.analysis));
                localStorage.setItem("userId", userId);

                onAnalysisComplete(data);
            } else {
                setError(data.error || "File analysis failed");
                toast.error(data.error || "Try pasting text for better results");
            }
        } catch (error: any) {
            console.error("File upload error:", error);
            setError(error.message || "Upload failed");
            toast.error("Upload failed. Try pasting text instead.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4">
            {/* Error Display */}
            {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-red-300">Analysis Error</h3>
                            <p className="text-sm text-red-200/80 mt-1">{error}</p>
                            <p className="text-xs text-red-300/60 mt-2">
                                Tip: Try pasting text directly for best results
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Card */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Brain className="h-6 w-6 text-blue-400" />
                            </div>
                            AI & Algorithm Resume Analysis
                        </h2>
                        <div className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full">
                            Powered by Gemini AI & PrepWise Engine
                        </div>
                    </div>
                    <p className="text-zinc-400 mt-3">
                        Get comprehensive ATS score, skill analysis, and personalized interview preparation. Works even when AI is offline.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Text Input Section */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Paste Your Resume Text (Recommended for Best Results)
                            </label>
                            <textarea
                                value={textInput}
                                onChange={(e) => {
                                    setTextInput(e.target.value);
                                    setError(null);
                                    setAnalysis(null);
                                }}
                                placeholder={`Example resume text to paste:
John Doe - Software Engineer
Skills: JavaScript, React, Node.js, Python
Experience: 3 years building web applications
Education: BS Computer Science
Projects: Built e-commerce platform with 10k+ users
Achievements: Improved performance by 40%`}
                                className="w-full min-h-[280px] rounded-xl bg-zinc-900/60 border-2 border-zinc-700/50 px-5 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none disabled:opacity-50 text-base leading-relaxed font-mono"
                                disabled={isUploading}
                            />
                            <div className="flex justify-between text-sm mt-3">
                                <span className={`${textInput.length < 50 ? 'text-amber-400' : 'text-green-400'}`}>
                                    {textInput.length} characters {textInput.length < 50 && '(min 50)'}
                                </span>
                                <span className="text-zinc-500">
                                    {textInput.length >= 50 ? '✓ Ready for analysis' : 'Enter more text'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleTextSubmit}
                            disabled={isUploading || textInput.length < 50}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/20 group"
                        >
                            {isUploading ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                    Analyzing Resume...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Brain className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                                    Analyze Resume
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800/50"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-6 bg-zinc-900 text-zinc-500 text-sm font-medium tracking-wider">OR</span>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Upload PDF File (Text extraction may be limited)
                            </label>
                            <div
                                className="border-3 border-dashed border-zinc-700/50 rounded-xl p-8 text-center hover:border-zinc-500/50 transition-all duration-300 cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/50 group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,application/pdf"
                                    className="hidden"
                                />

                                <div className="space-y-5">
                                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Upload className="h-10 w-10 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                                    </div>

                                    <div>
                                        <p className="font-semibold text-lg text-white mb-1">Upload Resume File</p>
                                        <p className="text-sm text-zinc-400">
                                            Supports PDF files
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-2">
                                            For best analysis results, paste text directly
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Results Display */}
            {analysis && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {/* Main Analysis Card */}
                    <div className="bg-gradient-to-br from-zinc-900/80 to-emerald-900/20 border-2 border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-emerald-500/5">
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-emerald-300">
                                        Analysis Complete
                                    </h2>
                                </div>
                                <div className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center gap-1">
                                    <Brain className="h-3 w-3" />
                                    {analysis.atsBreakdown ? "Enhanced Engine" : "Gemini AI"}
                                </div>
                            </div>
                            <p className="text-emerald-200/80 mt-3">
                                Comprehensive analysis ready for interview preparation
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* ATS Score & Role */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-700/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                ATS Score
                                            </h3>
                                            <p className="text-sm text-zinc-400">Compatibility Score</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-4xl font-bold text-emerald-400">
                                                {analysis.atsScore}
                                                <span className="text-xl text-zinc-500">/100</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Progress value={analysis.atsScore} className="h-2 bg-zinc-800" />
                                    <p className="mt-4 text-sm text-zinc-300">
                                        {analysis.atsScore >= 80 ? "Your resume is highly optimized!" : "Some areas need optimization for better ATS ranking."}
                                    </p>
                                </div>

                                <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-700/30">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-400" />
                                        Target Role
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/20 rounded-lg">
                                            <Sparkles className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-blue-300">{analysis.jobRole}</p>
                                            <p className="text-sm text-zinc-400 mt-1">{analysis.experience} Experience</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Improvements */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-700/30">
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <ListChecks className="h-5 w-5 text-purple-400" />
                                        Skills Identified
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.skills?.map((skill: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-700/30">
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-amber-400" />
                                        Key Improvements
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.improvements?.map((improvement: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                                {improvement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Job Recommendations Section */}
                            {jobRecommendations && (
                                <div className="bg-zinc-900/60 rounded-xl p-6 border border-blue-500/20">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Target className="h-6 w-6 text-blue-400" />
                                        Career Roadmap & Job Match
                                    </h3>
                                    <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">
                                        {jobRecommendations}
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="pt-4">
                                <Button
                                    onClick={() => onAnalysisComplete({ ...analysis, interviewQuestions, jobRecommendations })}
                                    className="w-full h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold shadow-xl shadow-indigo-500/20 group transition-all"
                                >
                                    Start Personalized Interview Preparation
                                    <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
