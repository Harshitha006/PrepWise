"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, PhoneOff, User, Bot, Loader2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define Speech Recognition types for TS
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface AgentProps {
    username: string;
    userId: string;
    type: "generate" | "interview";
    interviewId?: string;
    questions?: any[];
    onComplete?: (transcript: string) => void;
}

export default function Agent({ username, userId, type, interviewId, questions, onComplete }: AgentProps) {
    const [callStatus, setCallStatus] = useState<"inactive" | "active" | "finished">("inactive");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [fullTranscript, setFullTranscript] = useState<string[]>([]);
    const [aiResponse, setAiResponse] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [genState, setGenState] = useState<{ role?: string; level?: string; techStack?: string; type?: string; amount?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "en-US";

                recognitionRef.current.onresult = (event: any) => {
                    const result = event.results[0][0].transcript;
                    setTranscript(result);
                    setIsListening(false);
                    handleUserSpeech(result);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                    if (event.error !== "no-speech") {
                        toast.error("Speech recognition error: " + event.error);
                    }
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
            synthRef.current = window.speechSynthesis;
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const speak = (text: string, callback?: () => void) => {
        if (!synthRef.current) return;
        synthRef.current.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);

        // Find a better voice if possible
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Female")) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (callback) callback();
        };
        setAiResponse(text);
        synthRef.current.speak(utterance);
    };

    const listen = () => {
        if (recognitionRef.current && !isListening && !isSpeaking) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setTranscript("");
            } catch (e) {
                console.error("Failed to start listening", e);
            }
        }
    };

    const startCall = () => {
        setCallStatus("active");
        setFullTranscript([]);
        if (type === "generate") {
            const greeting = `Hello ${username}, I'm your PrepWise assistant. Let's get your mock interview ready. What job role are you practicing for?`;
            speak(greeting, () => listen());
        } else {
            const firstQuestion = questions && questions.length > 0 ? questions[0].question : "I don't have questions loaded.";
            const intro = `Hello ${username}, welcome to your ${type} interview. Let's begin. First question: ${firstQuestion}`;
            speak(intro, () => listen());
        }
    };

    const handleUserSpeech = async (speech: string) => {
        setFullTranscript(prev => [...prev, `User: ${speech}`]);

        if (type === "generate") {
            await handleGenerateFlow(speech);
        } else {
            await handleInterviewFlow(speech);
        }
    };

    const handleGenerateFlow = async (speech: string) => {
        const newState = { ...genState };
        let nextMessage = "";

        if (!newState.role) {
            newState.role = speech;
            nextMessage = "Got it. What experience level is this for? For example: Junior, Mid, or Senior.";
        } else if (!newState.level) {
            newState.level = speech;
            nextMessage = "Understood. What technologies or tech stack should we focus on? Mention a few like React, Node, or Python.";
        } else if (!newState.techStack) {
            newState.techStack = speech;
            nextMessage = "Great. What type of interview will this be? Technical, Behavioral, or Mixed?";
        } else if (!newState.type) {
            newState.type = speech;
            nextMessage = "Almost done. How many questions should I generate? Please say a number between 3 and 10.";
        } else if (!newState.amount) {
            const amountNum = parseInt(speech.match(/\d+/)?.[0] || "5");
            newState.amount = amountNum.toString();
            setIsLoading(true);
            setAiResponse("Perfect! Please wait a moment while I generate your custom interview questions...");
            speak("Perfect! Please wait a moment while I generate your custom interview questions...");

            try {
                const response = await fetch("/api/vapi/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...newState,
                        userId,
                        amount: amountNum
                    })
                });
                const data = await response.json();
                if (data.success) {
                    speak("Your interview is ready! Redirecting you to the dashboard now.", () => {
                        router.push("/");
                    });
                } else {
                    speak("I ran into an error generating the questions. Let's try that last part again. How many questions should I generate?");
                    newState.amount = undefined;
                }
            } catch (e) {
                speak("I had trouble connecting to the server. Please check your internet and try again.");
            } finally {
                setIsLoading(false);
            }
        }

        setGenState(newState);
        if (nextMessage) {
            setFullTranscript(prev => [...prev, `PrepWise: ${nextMessage}`]);
            speak(nextMessage, () => listen());
        }
    };

    const handleInterviewFlow = async (speech: string) => {
        const nextIndex = currentIndex + 1;
        if (questions && nextIndex < questions.length) {
            setCurrentIndex(nextIndex);
            const nextQuestion = questions[nextIndex].question;
            const feedbackPhrases = ["Good.", "Got it.", "I see.", "Interesting.", "Thank you."];
            const randomFeedback = feedbackPhrases[Math.floor(Math.random() * feedbackPhrases.length)];
            const response = `${randomFeedback} Next question: ${nextQuestion}`;

            setFullTranscript(prev => [...prev, `PrepWise: ${response}`]);
            speak(response, () => listen());
        } else {
            const closing = "That's all the questions I have for today. Thank you for your time. Your feedback will be ready shortly.";
            setAiResponse(closing);
            speak(closing, () => {
                setCallStatus("finished");
                if (onComplete) {
                    const finalTranscript = fullTranscript.join("\n");
                    onComplete(finalTranscript + "\nUser: " + speech);
                }
            });
        }
    };

    const endCall = () => {
        if (synthRef.current) synthRef.current.cancel();
        if (recognitionRef.current) recognitionRef.current.stop();
        setCallStatus("finished");
        if (type === "interview" && onComplete) {
            onComplete(fullTranscript.join("\n"));
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Interviewer Card */}
                <Card className={cn(
                    "relative flex flex-col items-center justify-center p-12 transition-all duration-500 overflow-hidden border-white/10",
                    isSpeaking ? "bg-purple-500/10 border-purple-500/30 scale-105 shadow-2xl shadow-purple-500/20" : "bg-zinc-900/50"
                )}>
                    {isSpeaking && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-40 w-40 animate-ping rounded-full bg-purple-500/10" />
                            <div className="h-60 w-60 animate-ping rounded-full bg-purple-500/5" />
                        </div>
                    )}
                    <div className={cn(
                        "relative z-10 h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300",
                        isSpeaking ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50" : "bg-zinc-800 text-zinc-500"
                    )}>
                        {isSpeaking ? <Volume2 size={64} /> : <Bot size={64} />}
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-zinc-200">AI Assistant</h3>
                    <p className="text-sm text-zinc-500 mt-2">
                        {isLoading ? "Generating..." : isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Standing by"}
                    </p>
                </Card>

                {/* User Card */}
                <Card className={cn(
                    "flex flex-col items-center justify-center p-12 transition-all duration-500 border-white/10",
                    isListening ? "bg-blue-500/10 border-blue-500/30 scale-105" : "bg-zinc-900/50"
                )}>
                    {isListening && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-40 w-40 animate-pulse rounded-full bg-blue-500/10" />
                        </div>
                    )}
                    <div className={cn(
                        "relative z-10 h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300",
                        isListening ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50" : "bg-zinc-800 text-zinc-500"
                    )}>
                        <User size={64} />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-zinc-200">{username}</h3>
                    <p className="text-sm text-zinc-500 mt-2">
                        {isListening ? "Talk now..." : "Candidate"}
                    </p>
                </Card>
            </div>

            {/* Transcript Box */}
            <div className="w-full space-y-4">
                <div className="relative min-h-24 w-full rounded-2xl bg-zinc-900/50 border border-white/5 p-6 flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Live Interaction</span>
                    {aiResponse && (
                        <p className="text-zinc-400 text-sm italic">PrepWise: "{aiResponse}"</p>
                    )}
                    {transcript ? (
                        <p className="text-white font-medium animate-in fade-in slide-in-from-bottom-2">
                            You: "{transcript}"
                        </p>
                    ) : !isSpeaking && callStatus === "active" && !isLoading && (
                        <p className="text-blue-400/60 text-xs animate-pulse">Waiting for your voice...</p>
                    )}
                </div>

                <div className="flex items-center justify-center gap-4">
                    {callStatus === "inactive" ? (
                        <Button
                            onClick={startCall}
                            size="lg"
                            className="h-16 px-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-bold shadow-xl shadow-purple-500/20"
                        >
                            <Mic className="mr-2 h-6 w-6" />
                            Start Voice Session
                        </Button>
                    ) : callStatus === "active" ? (
                        <Button
                            onClick={endCall}
                            size="lg"
                            variant="destructive"
                            className="h-16 px-10 rounded-full text-lg font-bold shadow-xl shadow-red-500/20"
                            disabled={isLoading}
                        >
                            <PhoneOff className="mr-2 h-6 w-6" />
                            End Session
                        </Button>
                    ) : (
                        <Button
                            onClick={() => window.location.reload()}
                            size="lg"
                            className="h-16 px-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-lg font-bold"
                        >
                            Restart
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
