"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Home,
    Brain,
    FileText,
    User,
    LogOut,
    Upload,
    History,
    Settings,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        // Clear all user data
        localStorage.removeItem("userId");
        localStorage.removeItem("resumeData");
        localStorage.removeItem("interviewHistory");
        localStorage.removeItem("interviews");

        // Redirect to sign-in
        router.push("/sign-in");
        router.refresh();
    };

    const handleNewResume = () => {
        router.push("/dashboard");
    };

    const navItems = [
        { name: "Home", icon: Home, path: "/" },
        { name: "Interview", icon: Brain, path: "/interview/now" },
        { name: "Resume", icon: FileText, path: "/dashboard" },
        { name: "History", icon: History, path: "/history" },
        { name: "Profile", icon: User, path: "/profile" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => router.push("/")}
                        >
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">
                                PrepWise
                            </span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.name}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "gap-2",
                                    pathname === item.path ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                                )}
                                onClick={() => router.push(item.path)}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Button>
                        ))}

                        {/* User Profile & Logout */}
                        <div className="relative group ml-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden lg:inline">Account</span>
                            </Button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="p-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                        onClick={() => router.push("/settings")}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Button>
                                    <div className="h-px bg-zinc-800 my-1"></div>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-zinc-800 py-4">
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <Button
                                    key={item.name}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3",
                                        pathname === item.path ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                                    )}
                                    onClick={() => {
                                        router.push(item.path);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Button>
                            ))}

                            <div className="h-px bg-zinc-800 my-2"></div>

                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 mb-2"
                                onClick={() => {
                                    handleNewResume();
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <Upload className="h-4 w-4" />
                                Upload New Resume
                            </Button>

                            <Button
                                variant="destructive"
                                className="w-full justify-start gap-3"
                                onClick={() => {
                                    handleLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
