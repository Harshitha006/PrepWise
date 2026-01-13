import { isAuthenticated } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const authenticated = await isAuthenticated();

    if (authenticated) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-black pattern">
            {children}
            <Toaster position="top-center" theme="dark" />
        </div>
    );
}
