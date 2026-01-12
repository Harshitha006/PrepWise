"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInterviewById } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import Agent from "@/components/Agent";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { createFeedback } from "@/lib/actions/feedback.action";

export default function InterviewRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const [interview, setInterview] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            const [interviewData, userData] = await Promise.all([
                getInterviewById(id as string),
                getCurrentUser()
            ]);
            setInterview(interviewData);
            setUser(userData);
            setLoading(false);
        }
        init();
    }, [id]);

    const handleComplete = async (transcript: string) => {
        if (!transcript) return;
        try {
            const result = await createFeedback(id as string, user.id, transcript);
            if (result.success) {
                router.push(`/interview/${id}/feedback`);
            }
        } catch (error) {
            console.error("Failed to create feedback", error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-10 w-64 bg-zinc-800" />
                    <Skeleton className="h-6 w-96 bg-zinc-800" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-80 w-full bg-zinc-800 rounded-3xl" />
                    <Skeleton className="h-80 w-full bg-zinc-800 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!interview) return <div>Interview not found</div>;

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 px-3 py-1">
                    Live Mock Interview
                </Badge>
                <h1 className="text-3xl font-bold text-zinc-100">{interview.role} Interview</h1>
                <div className="flex items-center justify-center gap-4 text-zinc-400">
                    <span className="text-sm uppercase tracking-widest">{interview.type}</span>
                    <span>•</span>
                    <span className="text-sm uppercase tracking-widest">{interview.level}</span>
                    <span>•</span>
                    <DisplayTechIcons techStack={interview.techStack} />
                </div>
            </div>

            <Agent
                username={user?.name || "Candidate"}
                userId={user?.id}
                type="interview"
                interviewId={interview.id}
                questions={interview.questions}
                onComplete={handleComplete}
            />
        </div>
    );
}
