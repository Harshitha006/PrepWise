"use client";
import { useState } from "react";
import InterviewAgent from "./InterviewAgent";
import { Loader2 } from "lucide-react";

interface SimpleInterviewAgentProps {
    userId: string;
    onComplete: (results: any) => void;
}

export default function SimpleInterviewAgent({
    userId,
    onComplete
}: SimpleInterviewAgentProps) {
    // Pre-defined questions for quick interview
    const questions = [
        {
            id: 1,
            question: "Tell me about your most recent project and your role in it.",
            category: "Experience",
            timeLimit: 120
        },
        {
            id: 2,
            question: "What is your favorite programming language and why?",
            category: "Technical",
            timeLimit: 90
        },
        {
            id: 3,
            question: "Describe a situation where you had to solve a difficult technical problem.",
            category: "Problem Solving",
            timeLimit: 120
        },
        {
            id: 4,
            question: "How do you handle feedback or criticism from a colleague?",
            category: "Behavioral",
            timeLimit: 90
        },
        {
            id: 5,
            question: "Why are you interested in this field?",
            category: "Motivation",
            timeLimit: 90
        }
    ];

    const sessionId = `quick_${Date.now()}`;

    return (
        <InterviewAgent
            userId={userId}
            sessionId={sessionId}
            questions={questions}
            onComplete={onComplete}
        />
    );
}
