import AuthForm from "@/components/AuthForm";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <AuthForm type="sign-up" />
        </div>
    );
}
