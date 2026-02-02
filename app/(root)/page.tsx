import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Zap, TrendingUp, ShieldCheck } from "lucide-react";
import PageLayout from "@/components/PageLayout";

export default function HomePage() {
    return (
        <PageLayout>
            <div className="min-h-screen">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-32">
                    {/* Background effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05),transparent_70%)] pointer-events-none" />

                    <div className="relative container mx-auto px-6">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
                                <Sparkles className="h-4 w-4" />
                                <span>AI-Powered Interview Prep</span>
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white leading-tight">
                                Ace Your Next <br />
                                <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    Interview
                                </span>
                            </h1>

                            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                                PrepWise uses advanced AI to analyze your resume, simulate realistic interviews,
                                and give you the feedback you need to land your dream job.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button asChild size="lg" className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-xl shadow-emerald-500/20">
                                    <Link href="/sign-up">
                                        Get Started Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-14 px-8 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-lg font-bold">
                                    <Link href="/sign-in">
                                        Sign In
                                    </Link>
                                </Button>
                            </div>

                            {/* Trust Badge / Stats */}
                            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">95%</span>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">Success Rate</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">10k+</span>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">Mock Interviews</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">ATS</span>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">Optmized</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">24/7</span>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">AI Coach</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-zinc-950/50 border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">Master Every Step</h2>
                            <p className="text-zinc-500">Our suite of AI tools covers the entire hiring pipeline</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-emerald-500/50 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">ATS Analysis</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Upload your resume and get an instant ATS compatibility score with actionable tips for improvement.
                                </p>
                            </div>

                            <div className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-blue-500/50 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Target className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">Voice Simulation</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Practice with a real-time voice interface that asks personalized questions based on your background.
                                </p>
                            </div>

                            <div className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-purple-500/50 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Zap className="h-6 w-6 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">Skill Gaps</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Identify exactly which skills are missing for your target role and get personalized study roadmaps.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32">
                    <div className="container mx-auto px-6">
                        <div className="max-w-5xl mx-auto rounded-3xl p-12 bg-gradient-to-br from-emerald-600 to-blue-700 text-center space-y-8 shadow-2xl shadow-emerald-500/20">
                            <h2 className="text-4xl md:text-6xl font-black text-white">
                                Ready to land your dream job?
                            </h2>
                            <p className="text-xl text-white/80 max-w-2xl mx-auto font-medium">
                                Stop guessing and start practicing. PrepWise gives you the edge you need to standout from other candidates.
                            </p>
                            <Button asChild size="lg" className="h-14 px-10 bg-white text-emerald-700 hover:bg-zinc-100 text-xl font-black rounded-full shadow-lg">
                                <Link href="/sign-up">
                                    Start Practice Now
                                    <ArrowRight className="ml-2 h-6 w-6" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-white/5 bg-zinc-950/50">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-emerald-400" />
                            <span className="text-xl font-black text-white tracking-tight">PREPWISE</span>
                        </div>
                        <p className="text-zinc-500 text-sm">© 2026 PrepWise AI. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Privacy</Link>
                            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Terms</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </PageLayout>
    );
}
