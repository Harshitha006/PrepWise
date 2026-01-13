import { redirect } from "next/navigation";
import InterviewSession from "@/components/InterviewSession";

interface PageProps {
    params: Promise<{ sessionId: string }>;
    searchParams: Promise<{ userId: string }>;
}

export default async function InterviewPage({ params, searchParams }: PageProps) {
    const { sessionId } = await params;
    const { userId } = await searchParams;

    if (!sessionId || !userId) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-black">
            <InterviewSession sessionId={sessionId} userId={userId} />
        </div>
    );
}
