"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Brain, Home, FileText, History, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", icon: Home, path: "/" },
        { name: "Interviews", icon: Brain, path: "/interview/now" },
        { name: "History", icon: History, path: "/history" },
        { name: "Profile", icon: Settings, path: "/profile" },
    ];

    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-white">PrepWise AI</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-4">
                            {navItems.map((item) => (
                                <Link key={item.path} href={item.path}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "gap-2",
                                            pathname === item.path ? "text-blue-400 bg-blue-500/10" : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <UserMenu />
                        ) : (
                            <Link href="/login">
                                <Button variant="outline" size="sm" className="border-zinc-700">
                                    Sign In
                                </Button>
                            </Link>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-zinc-800 py-4 animate-in slide-in-from-top duration-300">
                        <div className="space-y-2">
                            {navItems.map((item) => (
                                <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3",
                                            pathname === item.path ? "text-blue-400 bg-blue-500/10" : "text-zinc-400"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Button>
                                </Link>
                            ))}
                            {!user && (
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-start gap-3 border-zinc-700">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
