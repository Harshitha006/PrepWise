"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signUp, setSessionCookie } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const authSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(3, "Password must be at least 3 characters"),
}).refine((data) => {
    // If it's a hypothetical sign-up check, we'd check name here, 
    // but we'll handle specific validation in the component logic or refine based on a 'type' if needed.
    return true;
}, {});

interface AuthFormProps {
    type: "sign-in" | "sign-up";
}

export default function AuthForm({ type }: AuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof authSchema>>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof authSchema>) {
        if (!auth) {
            toast.error("Firebase authentication is not initialized. Check your environment variables.");
            return;
        }
        setIsLoading(true);
        try {
            if (type === "sign-up") {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    values.email,
                    values.password
                );
                const user = userCredential.user;

                await signUp({
                    uid: user.uid,
                    name: values.name!,
                    email: values.email,
                });

                const idToken = await user.getIdToken();
                await setSessionCookie(idToken);
                toast.success("Account created successfully!");
            } else {
                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    values.email,
                    values.password
                );
                const idToken = await userCredential.user.getIdToken();
                await setSessionCookie(idToken);
                toast.success("Signed in successfully!");
            }

            router.push("/");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "An error occurred during authentication");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-white/10 bg-black/40 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                    {type === "sign-in" ? "Welcome Back" : "Create Account"}
                </CardTitle>
                <CardDescription>
                    {type === "sign-in"
                        ? "Enter your credentials to access your account"
                        : "Sign up to start your interview preparation"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {type === "sign-up" && (
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} className="bg-white/5 border-white/10" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" {...field} className="bg-white/5 border-white/10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} className="bg-white/5 border-white/10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {type === "sign-in" ? "Sign In" : "Sign Up"}
                        </Button>
                    </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                    {type === "sign-in" ? (
                        <p>
                            Don't have an account?{" "}
                            <Link href="/sign-up" className="text-purple-400 hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <Link href="/sign-in" className="text-purple-400 hover:underline">
                                Sign In
                            </Link>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
