import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen bg-black text-zinc-100">
            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
                            P
                        </div>
                        <span className="text-xl font-bold tracking-tight">PrepWise</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-zinc-400">
                            {user.name}
                        </div>
                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10" />
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8">
                {children}
            </main>
            <Toaster position="top-center" theme="dark" />
        </div>
    );
}
