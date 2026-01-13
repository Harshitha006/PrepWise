"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Mic, StopCircle, Volume2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import InterviewAgent from "./InterviewAgent";

interface EnhancedInterviewAgentProps {
    userId: string;
    config: any;
    resumeData: any;
    onComplete: (results: any) => void;
}

export default function EnhancedInterviewAgent({
    userId,
    config,
    resumeData,
    onComplete
}: EnhancedInterviewAgentProps) {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]);
    const [sessionId, setSessionId] = useState("");

    useEffect(() => {
        generateSession();
    }, []);

    const generateSession = async () => {
        try {
            setLoading(true);
            // Create a local session ID
            const newSessionId = `session_${Date.now()}`;
            setSessionId(newSessionId);

            // Generate questions based on config
            const response = await fetch("/api/generate-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    resumeData,
                    difficulty: config.difficulty || "medium",
                    questionCount: config.questionCount || 5,
                    jobRole: config.role || resumeData?.jobRole
                })
            });

            const data = await response.json();

            if (data.success && data.questions) {
                setQuestions(data.questions);
            } else {
                // Fallback questions if API fails
                setQuestions([
                    { id: 1, question: "Tell me about yourself and your background.", category: "Introduction", timeLimit: 120 },
                    { id: 2, question: "What are your greatest strengths?", category: "Behavioral", timeLimit: 120 },
                    { id: 3, question: "Describe a technical challenge you've faced.", category: "Technical", timeLimit: 180 },
                    { id: 4, question: "Where do you see yourself in 5 years?", category: "Career Goals", timeLimit: 120 },
                    { id: 5, question: "Do you have any questions for us?", category: "Closing", timeLimit: 120 }
                ].slice(0, config.questionCount || 5));

                toast.warning("Using offline questions due to connection issue");
            }
        } catch (error) {
            console.error("Error generating session:", error);
            // Fallback questions
            setQuestions([
                { id: 1, question: "Tell me about yourself and your background.", category: "Introduction", timeLimit: 120 },
                { id: 2, question: "Switching to offline mode...", category: "System", timeLimit: 60 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-white">Preparing Your Interview</h3>
                <p className="text-zinc-400 mt-2">Generating questions based on {config.role} role...</p>
            </div>
        );
    }

    return (
        <InterviewAgent
            userId={userId}
            sessionId={sessionId}
            questions={questions}
            resumeData={resumeData}
            onComplete={onComplete}
        />
    );
}
