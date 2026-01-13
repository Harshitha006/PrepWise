import { redirect } from "next/navigation";
import InterviewSessionClient from "@/components/InterviewSessionClient";

interface PageProps {
    searchParams: Promise<{ sessionId?: string; userId?: string }>;
}

export default async function InterviewSessionPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const { sessionId, userId } = params;

    if (!sessionId || !userId) {
        redirect("/");
    }

    return <InterviewSessionClient sessionId={sessionId} userId={userId} />;
}
