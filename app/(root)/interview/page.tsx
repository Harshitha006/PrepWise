import { getCurrentUser } from "@/lib/actions/auth.action";
import Agent from "@/components/Agent";

export default async function InterviewGenerationPage() {
    const user = await getCurrentUser();
    if (!user) return null;

    return (
        <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                    Create Your Custom Interview
                </h1>
                <p className="text-zinc-400">
                    Our AI will help you set up the perfect interview. Talk to the assistant to define your role, tech stack, and experience level.
                </p>
            </div>

            <Agent
                username={user.name}
                userId={user.id}
                type="generate"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-2">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">1</div>
                    <h3 className="font-bold text-zinc-200">Voice Setup</h3>
                    <p className="text-xs text-zinc-500">Tell the AI what role you're applying for and what tech you want to practice.</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">2</div>
                    <h3 className="font-bold text-zinc-200">AI Logic</h3>
                    <p className="text-xs text-zinc-500">Gemini will generate specific questions tailored to your requirements.</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-2">
                    <div className="h-8 w-8 rounded-full bg-zinc-500/20 text-zinc-400 flex items-center justify-center font-bold">3</div>
                    <h3 className="font-bold text-zinc-200">Practice</h3>
                    <p className="text-xs text-zinc-500">Start the interview and receive detailed feedback from our experts.</p>
                </div>
            </div>
        </div>
    );
}
