"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, PhoneOff, User, Bot, Volume2, FileText, Brain, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface AgentProps {
    username: string;
    userId: string;
    type: "resume-analysis" | "mock-interview" | "feedback" | "skill-gap";
    interviewId?: string;
    resumeData?: {
        skills: string[];
        experience: string;
        jobRole: string;
        atsScore: number;
        improvements: string[];
    };
    jobRequirements?: {
        role: string;
        requiredSkills: string[];
        experienceLevel: string;
        industry: string;
    };
    onComplete?: (data: {
        transcript: string;
        feedback: any;
        skillGap: any[];
        sessionId?: string;
    }) => void;
    questions?: any[];
}

export default function Agent({
    username,
    userId,
    type,
    interviewId,
    resumeData,
    jobRequirements,
    onComplete,
    questions
}: AgentProps) {
    const [callStatus, setCallStatusState] = useState<"inactive" | "active" | "finished">("inactive");
    const [isSpeaking, setIsSpeakingState] = useState(false);
    const [isListening, setIsListeningState] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [fullTranscript, setFullTranscript] = useState<string[]>([]);
    const [aiResponse, setAiResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<
        "resume-analysis" | "mock-interview" | "feedback" | "skill-gap" | "complete"
    >(type);
    const [interviewData, setInterviewData] = useState<any>(null);

    const isSpeakingRef = useRef(false);
    const isListeningRef = useRef(false);
    const callStatusRef = useRef<"inactive" | "active" | "finished">("inactive");
    const currentQuestionIndexRef = useRef(0);
    const questionsRef = useRef<any[]>([]);
    const fullTranscriptRef = useRef<string[]>([]);
    const userAnswersRef = useRef<{ question: string; answer: string; evaluation: any }[]>([]);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const currentPhaseRef = useRef<string>(type);
    const router = useRouter();

    // Helper to keep ref in sync with state for callbacks
    useEffect(() => {
        currentPhaseRef.current = currentPhase;
    }, [currentPhase]);

    const updateIsSpeaking = (val: boolean) => {
        isSpeakingRef.current = val;
        setIsSpeakingState(val);
    };

    const updateIsListening = (val: boolean) => {
        isListeningRef.current = val;
        setIsListeningState(val);
    };

    const updateCallStatus = (val: "inactive" | "active" | "finished") => {
        callStatusRef.current = val;
        setCallStatusState(val);
    };

    const listen = useCallback(() => {
        if (!recognitionRef.current || isListeningRef.current || isSpeakingRef.current) return;
        try {
            recognitionRef.current.start();
            updateIsListening(true);
            setTranscript("");
        } catch (e) {
            console.error("Failed to start listening", e);
        }
    }, []);

    const speak = useCallback((text: string, callback?: () => void) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        updateIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v =>
            (v.name.includes("Google") || v.name.includes("Female")) && v.lang.startsWith("en")
        ) || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            updateIsSpeaking(false);
            if (callback) callback();
        };

        utterance.onerror = (e) => {
            updateIsSpeaking(false);
            if (callback) callback();
        };

        setAiResponse(text);
        synthRef.current.speak(utterance);
    }, []);

    const generateFeedback = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/analyze-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    answers: userAnswersRef.current,
                    resumeData,
                    jobRequirements
                })
            });

            const data = await response.json();
            if (data.success) {
                setInterviewData(data);
                const summary = `Evaluation complete. Your overall score is ${data.evaluation.overallScore} out of 100. Let's look at the skill gaps now.`;
                speak(summary, () => {
                    setCurrentPhase("skill-gap");
                    analyzeSkillGap(data.evaluation);
                });
            }
        } catch (error) {
            console.error("Error generating feedback:", error);
            speak("I had trouble analyzing the interview. Let's move to the skill gap analysis regardless.");
            setCurrentPhase("skill-gap");
        } finally {
            setIsLoading(false);
        }
    }, [userId, resumeData, jobRequirements, speak]);

    const analyzeSkillGap = useCallback(async (feedbackData: any) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/analyze-skill-gap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    resumeData,
                    interviewFeedback: feedbackData,
                    jobRequirements
                })
            });

            const data = await response.json();
            if (data.success) {
                const summary = `Based on your performance, the target role requires improvements in: ${data.skillGaps.map((g: any) => g.skill).join(", ")}. I've saved the detailed roadmap to your dashboard.`;
                speak(summary, () => {
                    setCurrentPhase("complete");
                    updateCallStatus("finished");
                    if (onComplete) {
                        onComplete({
                            transcript: fullTranscriptRef.current.join("\n"),
                            feedback: feedbackData,
                            skillGap: data.skillGaps
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Skill gap error:", error);
            speak("Session complete. You can view your results on the dashboard.");
            updateCallStatus("finished");
        } finally {
            setIsLoading(false);
        }
    }, [userId, resumeData, jobRequirements, speak, onComplete]);

    const handleMockInterview = useCallback(async (speech: string) => {
        if (questionsRef.current[currentQuestionIndexRef.current]) {
            userAnswersRef.current.push({
                question: questionsRef.current[currentQuestionIndexRef.current],
                answer: speech,
                evaluation: {}
            });
        }

        if (currentQuestionIndexRef.current < questionsRef.current.length - 1) {
            currentQuestionIndexRef.current++;
            const nextQObj = questionsRef.current[currentQuestionIndexRef.current];
            const nextQuestion = typeof nextQObj === "string" ? nextQObj : (nextQObj.question || "Next question");
            speak(`Got it. Next: ${nextQuestion}`, () => listen());
        } else {
            speak("That concludes the questions. Analyzing your performance now...", () => {
                setCurrentPhase("feedback");
                generateFeedback();
            });
        }
    }, [speak, listen, generateFeedback]);

    const handleUserSpeech = useCallback(async (speech: string) => {
        if (!speech || speech.trim().length === 0) return;
        fullTranscriptRef.current.push(`${username}: ${speech}`);
        setFullTranscript([...fullTranscriptRef.current]);

        if (currentPhaseRef.current === "resume-analysis") {
            speak("Perfect. Starting the mock interview now based on your resume.", () => {
                setCurrentPhase("mock-interview");
                if (questionsRef.current.length > 0) {
                    const firstQObj = questionsRef.current[0];
                    const firstQuestion = typeof firstQObj === "string" ? firstQObj : (firstQObj.question || "First question");
                    speak(`First question: ${firstQuestion}`, () => listen());
                } else {
                    speak("I'm still preparing the questions. One moment.", () => {
                        // Should theoretically wait here or retry
                    });
                }
            });
        } else if (currentPhaseRef.current === "mock-interview") {
            await handleMockInterview(speech);
        }
    }, [username, speak, listen, handleMockInterview]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.lang = "en-US";
                recognitionRef.current.onresult = (e: any) => {
                    const result = e.results[0][0].transcript;
                    if (result) {
                        setTranscript(result);
                        updateIsListening(false);
                        handleUserSpeech(result);
                    }
                };
                recognitionRef.current.onerror = () => {
                    updateIsListening(false);
                    if (callStatusRef.current === "active" && !isSpeakingRef.current) setTimeout(() => listen(), 500);
                };
                recognitionRef.current.onend = () => {
                    updateIsListening(false);
                    if (callStatusRef.current === "active" && !isSpeakingRef.current && !isListeningRef.current) setTimeout(() => listen(), 300);
                };
            }
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthRef.current) synthRef.current.cancel();
        };
    }, [handleUserSpeech, listen]);

    const startSession = async () => {
        updateCallStatus("active");
        fullTranscriptRef.current = [];
        userAnswersRef.current = [];
        currentQuestionIndexRef.current = 0;

        if (questions && questions.length > 0) {
            questionsRef.current = questions;
        } else {
            setIsLoading(true);
            try {
                const qRes = await fetch("/api/generate-questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        role: resumeData?.jobRole,
                        skills: resumeData?.skills,
                        experience: resumeData?.experience,
                        jobRequirements
                    })
                });
                const qData = await qRes.json();
                if (qData.success) {
                    questionsRef.current = qData.questions;
                }
            } catch (e) {
                console.error("Failed to load questions", e);
            }
            setIsLoading(false);
        }

        if (currentPhase === "resume-analysis") {
            speak(`Hello ${username}! I've analyzed your resume. Your ATS score is ${resumeData?.atsScore || 0}. Ready to start the interview?`, () => listen());
        } else {
            if (questionsRef.current.length > 0) {
                const firstQObj = questionsRef.current[0];
                const firstQuestion = typeof firstQObj === "string" ? firstQObj : (firstQObj.question || "First question");
                speak(`Hello ${username}, let's start. First question: ${firstQuestion}`, () => listen());
            }
        }
    };

    const getPhaseIcon = (phase: string) => {
        switch (phase) {
            case "resume-analysis": return <FileText size={20} />;
            case "mock-interview": return <Mic size={20} />;
            case "feedback": return <Brain size={20} />;
            case "skill-gap": return <Target size={20} />;
            default: return <Bot size={20} />;
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto py-10">
            <div className="flex justify-center gap-4 mb-8 overflow-x-auto w-full px-4">
                {["resume-analysis", "mock-interview", "feedback", "skill-gap"].map((phase, index) => (
                    <div key={phase} className="flex items-center gap-2">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            currentPhase === phase ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-400"
                        )}>
                            {getPhaseIcon(phase)}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap hidden md:inline">{phase.replace("-", " ")}</span>
                        {index < 3 && <div className="w-4 md:w-8 h-0.5 bg-zinc-600" />}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <Card className={cn("p-12 flex flex-col items-center justify-center bg-zinc-900 shadow-xl border-white/10", isSpeaking && "bg-purple-500/10 border-purple-500/30")}>
                    <Bot size={64} className={cn("text-zinc-500", isSpeaking && "text-purple-500")} />
                    <h3 className="mt-4 font-bold text-xl">AI Coach</h3>
                    <p className="text-sm text-zinc-500">{isLoading ? "Processing..." : isSpeaking ? "Speaking..." : "Ready"}</p>
                </Card>
                <Card className={cn("p-12 flex flex-col items-center justify-center bg-zinc-900 shadow-xl border-white/10", isListening && "bg-blue-500/10 border-blue-500/30")}>
                    <User size={64} className={cn("text-zinc-500", isListening && "text-blue-500")} />
                    <h3 className="mt-4 font-bold text-xl">{username}</h3>
                    <p className="text-sm text-zinc-500">{isListening ? "Listening..." : "Candidate"}</p>
                </Card>
            </div>

            <div className="w-full space-y-4">
                <div className="min-h-32 bg-zinc-900 rounded-xl p-6 border border-white/5">
                    {aiResponse && <p className="text-blue-400 text-sm italic mb-2">Coach: {aiResponse}</p>}
                    {transcript ? <p className="text-white">You: "{transcript}"</p> : <p className="text-zinc-600 animate-pulse italic">Waiting for your voice...</p>}
                </div>
                <div className="flex justify-center gap-4">
                    {callStatus === "inactive" ? (
                        <Button onClick={startSession} size="lg" disabled={isLoading} className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-lg font-bold">
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Brain className="mr-2" />}
                            Start Interview Prep
                        </Button>
                    ) : (
                        <Button onClick={() => window.location.reload()} variant="destructive" className="h-16 px-10 rounded-full text-lg font-bold">End Session</Button>
                    )}
                </div>
            </div>
        </div>
    );
}
