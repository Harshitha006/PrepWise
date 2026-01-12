import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId, getLatestInterviews } from "@/lib/actions/general.action";
import InterviewCard from "@/components/InterviewCard";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) return null;

    const [userInterviews, latestInterviews] = await Promise.all([
        getInterviewsByUserId(user.id),
        getLatestInterviews({ userId: user.id }),
    ]);

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 p-8 md:p-12">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            Master Your Next <br />
                            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                                Tech Interview
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-400">
                            Practice with AI-powered voice interviews. Get real-time feedback and detailed analysis to land your dream job.
                        </p>
                        <Link href="/interview">
                            <Button size="lg" className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 px-8 text-lg font-semibold shadow-xl shadow-purple-500/20">
                                <Mic className="mr-2 h-5 w-5" />
                                Start Preparation
                            </Button>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-32 w-32 rounded-2xl bg-zinc-800/50 border border-white/5 flex flex-col items-center justify-center gap-2">
                                <span className="text-3xl font-bold text-purple-400">{userInterviews.length}</span>
                                <span className="text-xs text-zinc-500 uppercase tracking-widest">Total</span>
                            </div>
                            <div className="h-32 w-32 rounded-2xl bg-zinc-800/50 border border-white/5 flex flex-col items-center justify-center gap-2">
                                <span className="text-3xl font-bold text-blue-400">
                                    {userInterviews.filter((i: any) => i.score).length}
                                </span>
                                <span className="text-xs text-zinc-500 uppercase tracking-widest">Feedback</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Your Interviews */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                        Your Interviews
                        <span className="text-sm font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                            {userInterviews.length}
                        </span>
                    </h2>
                </div>

                {userInterviews.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {userInterviews.map((interview: any) => (
                            <InterviewCard key={interview.id} interview={interview} showFeedback={!!interview.score} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-zinc-900/20">
                        <p className="text-zinc-500 mb-4">You haven't created any interviews yet.</p>
                        <Link href="/interview">
                            <Button variant="outline" className="border-white/10 hover:bg-white/5">
                                Create First Interview
                            </Button>
                        </Link>
                    </div>
                )}
            </section>

            {/* Community Interviews */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-100">Take an Interview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {latestInterviews.map((interview: any) => (
                        <InterviewCard key={interview.id} interview={interview} />
                    ))}
                </div>
            </section>
        </div>
    );
}
