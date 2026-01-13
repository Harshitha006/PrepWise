"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
    Brain,
    Clock,
    Target,
    Zap,
    CheckCircle,
    MessageSquare,
    Code,
    Users,
    Settings
} from "lucide-react";

interface InterviewSetupProps {
    onStart: (config: InterviewConfig) => void;
    onCancel: () => void;
    defaultRole?: string;
}

interface InterviewConfig {
    questionCount: number;
    questionTypes: {
        technical: boolean;
        behavioral: boolean;
        scenario: boolean;
    };
    difficulty: "easy" | "medium" | "hard" | "mixed";
    timePerQuestion: number;
    focusAreas: string[];
}

export default function InterviewSetup({ onStart, onCancel, defaultRole = "Software Developer" }: InterviewSetupProps) {
    const [config, setConfig] = useState<InterviewConfig>({
        questionCount: 10,
        questionTypes: {
            technical: true,
            behavioral: true,
            scenario: true
        },
        difficulty: "mixed",
        timePerQuestion: 20, // seconds
        focusAreas: []
    });

    const handleTypeToggle = (type: keyof typeof config.questionTypes) => {
        setConfig(prev => ({
            ...prev,
            questionTypes: {
                ...prev.questionTypes,
                [type]: !prev.questionTypes[type]
            }
        }));
    };

    const handleStart = () => {
        if (!config.questionTypes.technical && !config.questionTypes.behavioral && !config.questionTypes.scenario) {
            alert("Please select at least one question type!");
            return;
        }
        onStart(config);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Card className="border-blue-500/20 bg-gradient-to-br from-zinc-900/80 to-blue-900/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-white">
                        <Settings className="h-6 w-6 text-blue-400" />
                        Interview Configuration
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Customize your mock interview experience
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Question Count */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Brain className="h-5 w-5 text-blue-400" />
                                Number of Questions
                            </Label>
                            <span className="text-2xl font-bold text-blue-400">
                                {config.questionCount}
                            </span>
                        </div>
                        <Slider
                            value={[config.questionCount]}
                            onValueChange={([value]) => setConfig(prev => ({ ...prev, questionCount: value }))}
                            min={5}
                            max={20}
                            step={1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-zinc-500">
                            <span>Quick (5)</span>
                            <span>Standard (10)</span>
                            <span>Comprehensive (20)</span>
                        </div>
                    </div>

                    {/* Question Types */}
                    <div className="space-y-4">
                        <Label className="text-lg font-medium text-white flex items-center gap-2">
                            <Target className="h-5 w-5 text-purple-400" />
                            Question Types
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                type="button"
                                variant={config.questionTypes.technical ? "default" : "outline"}
                                onClick={() => handleTypeToggle("technical")}
                                className={`h-24 flex-col gap-3 ${config.questionTypes.technical ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                            >
                                <Code className="h-8 w-8" />
                                <div className="text-center">
                                    <div className="font-semibold">Technical</div>
                                    <div className="text-xs opacity-80">Coding & Concepts</div>
                                </div>
                                {config.questionTypes.technical && <CheckCircle className="absolute top-2 right-2 h-4 w-4" />}
                            </Button>

                            <Button
                                type="button"
                                variant={config.questionTypes.behavioral ? "default" : "outline"}
                                onClick={() => handleTypeToggle("behavioral")}
                                className={`h-24 flex-col gap-3 ${config.questionTypes.behavioral ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                            >
                                <Users className="h-8 w-8" />
                                <div className="text-center">
                                    <div className="font-semibold">Behavioral</div>
                                    <div className="text-xs opacity-80">Experience & Scenarios</div>
                                </div>
                                {config.questionTypes.behavioral && <CheckCircle className="absolute top-2 right-2 h-4 w-4" />}
                            </Button>

                            <Button
                                type="button"
                                variant={config.questionTypes.scenario ? "default" : "outline"}
                                onClick={() => handleTypeToggle("scenario")}
                                className={`h-24 flex-col gap-3 ${config.questionTypes.scenario ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                            >
                                <MessageSquare className="h-8 w-8" />
                                <div className="text-center">
                                    <div className="font-semibold">Scenario</div>
                                    <div className="text-xs opacity-80">Real-world Problems</div>
                                </div>
                                {config.questionTypes.scenario && <CheckCircle className="absolute top-2 right-2 h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-4">
                        <Label className="text-lg font-medium text-white flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-400" />
                            Difficulty Level
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(["easy", "medium", "hard", "mixed"] as const).map((level) => (
                                <Button
                                    key={level}
                                    type="button"
                                    variant={config.difficulty === level ? "default" : "outline"}
                                    onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
                                    className={`capitalize ${config.difficulty === level ?
                                        level === "easy" ? "bg-green-600 hover:bg-green-700" :
                                            level === "medium" ? "bg-yellow-600 hover:bg-yellow-700" :
                                                level === "hard" ? "bg-red-600 hover:bg-red-700" :
                                                    "bg-purple-600 hover:bg-purple-700"
                                        : ""}`}
                                >
                                    {level}
                                </Button>
                            ))}
                        </div>
                        <div className="text-sm text-zinc-400">
                            {config.difficulty === "easy" && "Focus on fundamentals and basic concepts"}
                            {config.difficulty === "medium" && "Mix of basic and intermediate questions"}
                            {config.difficulty === "hard" && "Challenging questions including system design"}
                            {config.difficulty === "mixed" && "Varied difficulty based on question type"}
                        </div>
                    </div>

                    {/* Time per Question */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-emerald-400" />
                                Time per Question
                            </Label>
                            <span className="text-2xl font-bold text-emerald-400">
                                {config.timePerQuestion}s
                            </span>
                        </div>
                        <Slider
                            value={[config.timePerQuestion]}
                            onValueChange={([value]) => setConfig(prev => ({ ...prev, timePerQuestion: value }))}
                            min={10}
                            max={60}
                            step={5}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-zinc-500">
                            <span>Quick (10s)</span>
                            <span>Standard (20s)</span>
                            <span>Detailed (60s)</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1 h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStart}
                            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold"
                        >
                            Start Interview
                        </Button>
                    </div>

                    {/* Estimated Time */}
                    <div className="text-center pt-4 border-t border-zinc-800">
                        <p className="text-zinc-400">
                            Estimated interview time:{" "}
                            <span className="text-white font-semibold">
                                {Math.round((config.questionCount * config.timePerQuestion) / 60)} minutes
                            </span>
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">
                            Plus additional time for thinking and feedback
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
