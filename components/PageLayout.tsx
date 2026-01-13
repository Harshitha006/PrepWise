"use client";
import { ReactNode } from "react";
import Navbar from "./Navbar";

interface PageLayoutProps {
    children: ReactNode;
    showNavbar?: boolean;
    className?: string;
}

export default function PageLayout({
    children,
    showNavbar = true,
    className = ""
}: PageLayoutProps) {
    return (
        <>
            {showNavbar && <Navbar />}
            <div className={`min-h-screen bg-gradient-to-b from-zinc-900 to-black ${className}`}>
                {children}
            </div>
        </>
    );
}
