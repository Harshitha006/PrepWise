"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Mic,
    Volume2,
    SkipForward,
    Pause,
    Play,
    Brain,
    Timer,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Star,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface InterviewSessionProps {
    sessionId: string;
    userId: string;
}

export default function InterviewSession({ sessionId, userId }: InterviewSessionProps) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [transcript, setTranscript] = useState("");
    const [timer, setTimer] = useState(0);
    const [interviewCompleted, setInterviewCompleted] = useState(false);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const timerRef = useRef<NodeJS.Timeout>(null);
    const router = useRouter();

    // Load interview session
    useEffect(() => {
        loadInterviewSession();
    }, [sessionId, userId]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = "en-US";

                recognitionRef.current.onresult = (event: any) => {
                    let currentTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    setTranscript(currentTranscript);
                    if (event.results[event.results.length - 1].isFinal) {
                        setUserAnswer(prev => prev + " " + event.results[event.results.length - 1][0].transcript);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    if (isListening && !isPaused) {
                        try {
                            recognitionRef.current?.start();
                        } catch (e) { }
                    }
                };
            }

            synthRef.current = window.speechSynthesis;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isListening, isPaused]);

    const loadInterviewSession = async () => {
        try {
            const response = await fetch(`/api/get-interview?sessionId=${sessionId}&userId=${userId}`);
            const data = await response.json();

            if (data.success) {
                setSession(data.session);
                if (data.session.questions && data.session.questions.length > 0) {
                    // Start with first question
                    setTimeout(() => {
                        speakQuestion(data.session.questions[0].question);
                    }, 1000);
                }
            } else {
                throw new Error(data.error || "Failed to load interview");
            }
        } catch (error) {
            console.error("Error loading session:", error);
            toast.error("Failed to load interview session");
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const speakQuestion = (text: string) => {
        if (!synthRef.current) return;

        synthRef.current.cancel();
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            setIsSpeaking(false);
            // Start listening for answer after question is spoken
            setTimeout(() => startListening(), 500);
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            setTimeout(() => startListening(), 500);
        };

        synthRef.current.speak(utterance);
    };

    const startListening = () => {
        if (!recognitionRef.current || isListening || isSpeaking) return;

        try {
            recognitionRef.current.start();
            setIsListening(true);
            setTranscript("");
        } catch (error) {
            console.error("Failed to start listening:", error);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleAnswerSubmit = async () => {
        if (!userAnswer.trim() && !transcript.trim()) {
            toast.error("Please provide an answer");
            return;
        }

        const finalAnswer = userAnswer + " " + transcript;

        // Save answer
        const updatedSession = { ...session };
        if (!updatedSession.userAnswers) {
            updatedSession.userAnswers = [];
        }

        updatedSession.userAnswers.push({
            question: session.questions[currentQuestionIndex].question,
            answer: finalAnswer.trim(),
            timestamp: new Date().toISOString(),
            timeSpent: timer
        });

        // Move to next question or complete
        if (currentQuestionIndex < session.questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setUserAnswer("");
            setTranscript("");
            setTimer(0);
            setIsListening(false);

            // Speak next question after delay
            setTimeout(() => {
                speakQuestion(session.questions[nextIndex].question);
            }, 1000);

            // Update session
            updatedSession.currentQuestion = nextIndex;
        } else {
            // Interview complete
            completeInterview(updatedSession);
        }

        // Update session
        setSession(updatedSession);

        // Save progress
        await saveProgress(updatedSession);
    };

    const completeInterview = async (sessionData: any) => {
        setInterviewCompleted(true);
        setIsPaused(true);
        setIsListening(false);

        // Stop any speech/listening
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        sessionData.status = "completed";
        sessionData.completedAt = new Date().toISOString();
        setSession(sessionData);

        // Save final session
        await saveProgress(sessionData);

        // Speak completion message
        speakMessage("Interview complete! Great job. Processing your feedback now.");

        toast.success("Interview Completed!");

        // Navigate to feedback
        router.push(`/interview/feedback/${sessionId}?userId=${userId}`);
    };

    const speakMessage = (text: string) => {
        if (!synthRef.current) return;

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        synthRef.current.speak(utterance);
    };

    const saveProgress = async (sessionData: any) => {
        try {
            await fetch("/api/save-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessionData)
            });
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
        if (!isPaused) {
            // Is pausing
            if (synthRef.current) synthRef.current.pause();
            if (isListening) stopListening();
        } else {
            // Is resuming
            if (synthRef.current) synthRef.current.resume();
            if (session && !isSpeaking) startListening();
        }
    };

    const skipQuestion = () => {
        if (currentQuestionIndex < session.questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setUserAnswer("");
            setTranscript("");
            setTimer(0);
            setIsListening(false);
            speakQuestion(session.questions[nextIndex].question);
        }
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isListening && !isPaused) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isListening, isPaused]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <Loader2 className="animate-spin h-16 w-16 text-blue-500" />
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-white">Preparing Interview</h3>
                    <p className="text-zinc-400">Loading questions and setting up voice session...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Session Not Found</h3>
                <p className="text-zinc-400 mb-6">The interview session could not be loaded.</p>
                <Button onClick={() => router.push("/dashboard")}>
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    const currentQuestion = session.questions?.[currentQuestionIndex];

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mock Interview</h1>
                    <p className="text-zinc-400">
                        {session.resumeData?.jobRole || "Technical"} Interview • Question {currentQuestionIndex + 1} of {session.questions?.length || 0}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg">
                        <Timer className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-mono">
                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (confirm("Are you sure you want to end the interview?")) {
                                router.push("/dashboard");
                            }
                        }}
                    >
                        <X className="h-4 w-4 mr-2" />
                        End Interview
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <MessageSquare className="h-5 w-5 text-blue-400" />
                                Current Question
                                {currentQuestion?.category && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentQuestion.category === "TECHNICAL" ? "bg-blue-500/20 text-blue-400" :
                                            currentQuestion.category === "BEHAVIORAL" ? "bg-purple-500/20 text-purple-400" :
                                                "bg-emerald-500/20 text-emerald-400"
                                        }`}>
                                        {currentQuestion.category}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-xl text-white leading-relaxed font-medium">
                                {currentQuestion?.question}
                            </div>

                            {currentQuestion?.tips && (
                                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain className="h-4 w-4 text-blue-400" />
                                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Interview Tip</span>
                                    </div>
                                    <p className="text-sm text-zinc-300">{currentQuestion.tips}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Mic className="h-5 w-5 text-emerald-400" />
                                Your Answer
                                {isListening && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription className="text-zinc-500">
                                {isListening ? "Listening to your voice..." : "Click start to begin speaking"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="min-h-[160px] p-5 bg-black/40 rounded-xl border border-white/5 text-lg leading-relaxed">
                                {transcript ? (
                                    <span className="text-white">{userAnswer} <span className="text-emerald-400">{transcript}</span></span>
                                ) : userAnswer ? (
                                    <span className="text-white">{userAnswer}</span>
                                ) : (
                                    <span className="text-zinc-600 italic">Your response will be transcribed here as you speak...</span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={() => isListening ? stopListening() : startListening()}
                                    size="lg"
                                    className={`flex-1 h-16 text-lg font-bold shadow-lg transition-all ${isListening
                                            ? "bg-red-500 hover:bg-red-600 text-white"
                                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        }`}
                                    disabled={isSpeaking || interviewCompleted}
                                >
                                    <Mic className="h-6 w-6 mr-3" />
                                    {isListening ? "Stop Recording" : "Start Speaking"}
                                </Button>

                                <Button
                                    onClick={togglePause}
                                    variant="outline"
                                    size="lg"
                                    className="h-16 px-8 border-white/10 hover:bg-white/5"
                                    disabled={interviewCompleted}
                                >
                                    {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                                </Button>

                                <Button
                                    onClick={skipQuestion}
                                    variant="outline"
                                    size="lg"
                                    className="h-16 border-white/10 hover:bg-white/5"
                                    disabled={interviewCompleted}
                                >
                                    <SkipForward className="h-6 w-6" />
                                </Button>
                            </div>

                            <Button
                                onClick={handleAnswerSubmit}
                                size="lg"
                                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold shadow-xl shadow-blue-900/20"
                                disabled={(!userAnswer.trim() && !transcript.trim()) || interviewCompleted}
                            >
                                {currentQuestionIndex < session.questions.length - 1 ? (
                                    <>Next Question <SkipForward className="ml-3 h-6 w-6" /></>
                                ) : (
                                    <>Finish Interview <CheckCircle className="ml-3 h-6 w-6" /></>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500 font-medium">Completed</span>
                                    <span className="text-blue-400 font-bold">{currentQuestionIndex} / {session.questions?.length}</span>
                                </div>
                                <Progress value={(currentQuestionIndex / session.questions?.length) * 100} className="h-2 bg-zinc-800" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                                    <div className="text-xl font-bold text-white">{session.questions?.filter((q: any) => q.category === "TECHNICAL").length}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Technical</div>
                                </div>
                                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                                    <div className="text-xl font-bold text-white">{session.questions?.filter((q: any) => q.category === "BEHAVIORAL").length}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Behavioral</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Interview Session Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Target Role</span>
                                    <span className="text-white font-medium">{session.resumeData?.jobRole}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Difficulty</span>
                                    <span className="text-blue-400 font-medium capitalize">{session.difficulty}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Status</span>
                                    <span className="text-emerald-500 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Active
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Questions Overview</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {session.questions?.map((q: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl border ${idx === currentQuestionIndex
                                            ? "bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/20"
                                            : idx < currentQuestionIndex
                                                ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                                                : "bg-zinc-800/30 border-white/5"
                                        } transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === currentQuestionIndex ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs truncate ${idx === currentQuestionIndex ? "text-white font-bold" : "text-zinc-500"}`}>
                                                {q.question}
                                            </p>
                                            <span className="text-[9px] uppercase font-black text-zinc-600 mt-1 block">{q.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
