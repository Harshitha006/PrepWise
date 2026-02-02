"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (!user) return null;

    const userInitials = user.email
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ""} alt={user.email || "User"} />
                        <AvatarFallback className="bg-blue-600 text-white">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.displayName || user.email?.split("@")[0] || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-500 focus:text-red-500"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
