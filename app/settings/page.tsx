"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Settings,
    User,
    Bell,
    Mic,
    Save,
    Trash2,
    LogOut
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        voiceSpeed: 1.0,
        voiceVolume: 1.0,
        notifications: true,
        darkMode: true,
        language: "en",
        autoStart: false,
    });
    const [username, setUsername] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Load saved settings
        const savedSettings = localStorage.getItem("userSettings");
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        const savedUsername = localStorage.getItem("username") || "User";
        setUsername(savedUsername);
    }, []);

    const handleSave = () => {
        localStorage.setItem("userSettings", JSON.stringify(settings));
        localStorage.setItem("username", username);

        toast.success("Settings Saved", {
            description: "Your preferences have been updated.",
            duration: 3000
        });
    };

    const handleReset = () => {
        setSettings({
            voiceSpeed: 1.0,
            voiceVolume: 1.0,
            notifications: true,
            darkMode: true,
            language: "en",
            autoStart: false,
        });
        setUsername("User");
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
            localStorage.clear();
            toast.success("Account Data Deleted", {
                description: "All your data has been removed.",
                duration: 3000
            });
            router.push("/");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("resumeData");
        localStorage.removeItem("interviewHistory");
        toast.success("Logged Out", {
            description: "You have been successfully logged out.",
            duration: 3000
        });
        router.push("/sign-in");
    };

    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                        <Settings className="h-8 w-8 text-blue-400" />
                        Settings
                    </h1>
                    <p className="text-zinc-400">
                        Customize your interview preparation experience
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Profile Settings */}
                    <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <User className="h-5 w-5 text-blue-400" />
                                Profile Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Display Name</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Settings */}
                    <Card className="border-purple-500/20 bg-gradient-to-br from-zinc-900/80 to-purple-900/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Mic className="h-5 w-5 text-purple-400" />
                                Interview Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white">Voice Speed</Label>
                                        <p className="text-sm text-zinc-400">Adjust AI voice speaking rate</p>
                                    </div>
                                    <span className="text-lg font-bold text-purple-400">
                                        {settings.voiceSpeed.toFixed(1)}x
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.voiceSpeed]}
                                    onValueChange={([value]: number[]) => setSettings({ ...settings, voiceSpeed: value })}
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white">Voice Volume</Label>
                                        <p className="text-sm text-zinc-400">Adjust AI voice volume</p>
                                    </div>
                                    <span className="text-lg font-bold text-purple-400">
                                        {Math.round(settings.voiceVolume * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.voiceVolume]}
                                    onValueChange={([value]: number[]) => setSettings({ ...settings, voiceVolume: value })}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white">Auto-start Interviews</Label>
                                        <p className="text-sm text-zinc-400">Start interviews immediately after setup</p>
                                    </div>
                                    <Switch
                                        checked={settings.autoStart}
                                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, autoStart: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="border-emerald-500/20 bg-gradient-to-br from-zinc-900/80 to-emerald-900/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Bell className="h-5 w-5 text-emerald-400" />
                                Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-white">Enable Notifications</Label>
                                    <p className="text-sm text-zinc-400">Receive updates and reminders</p>
                                </div>
                                <Switch
                                    checked={settings.notifications}
                                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, notifications: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={handleSave}
                            className="h-12 bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </Button>

                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="h-12"
                        >
                            Reset to Defaults
                        </Button>

                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="h-12 text-red-400 border-red-500/20 hover:bg-red-500/10"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>

                        <Button
                            onClick={handleDeleteAccount}
                            variant="destructive"
                            className="h-12"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete All Data
                        </Button>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
