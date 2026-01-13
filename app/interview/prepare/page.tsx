import { redirect } from "next/navigation";
import InterviewPrepareClient from "@/components/InterviewPrepareClient";

interface PageProps {
    searchParams: Promise<{ userId?: string; resumeId?: string }>;
}

export default async function InterviewPreparePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const { userId, resumeId } = params;

    if (!userId) {
        redirect("/");
    }

    return <InterviewPrepareClient userId={userId} resumeId={resumeId} />;
}
