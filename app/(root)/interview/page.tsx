import { getCurrentUser } from "@/lib/actions/auth.action";
import Agent from "@/components/Agent";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";

export default async function InterviewPage() {
    const user = await getCurrentUser();
    if (!user) return null;

    if (!user.hasResume) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <FileWarning className="h-10 w-10 text-yellow-500" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-3xl font-bold">Resume Required</h1>
                    <p className="text-zinc-500">
                        To provide a personalized interview experience, please upload your resume on the dashboard first.
                    </p>
                </div>
                <Link href="/">
                    <Button size="lg" className="rounded-full px-8">
                        Go to Dashboard
                    </Button>
                </Link>
            </div>
        );
    }

    // Mock resume data from user profile (updated by /api/upload-resume)
    const resumeData = {
        skills: user.skills || [],
        experience: user.experience || "Not specified",
        jobRole: user.preferredRole || "Software Developer",
        atsScore: user.atsScore || 0,
        improvements: [] // Can fetch from a separate collection if needed
    };

    return (
        <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                    PrepWise Coaching Session
                </h1>
                <p className="text-zinc-400">
                    Welcome back, {user.name}. We'll start by reviewing your resume profile and then dive into a mock interview.
                </p>
            </div>

            <Agent
                username={user.name}
                userId={user.id}
                type="resume-analysis"
                resumeData={resumeData}
                jobRequirements={{
                    role: user.preferredRole || "Full Stack Developer",
                    requiredSkills: user.skills || [],
                    experienceLevel: user.experience || "Junior",
                    industry: "Tech"
                }}
            />
        </div>
    );
}
