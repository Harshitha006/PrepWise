"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Volume2, User, Bot, Clock, SkipForward, Pause, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface InterviewAgentProps {
    userId: string;
    sessionId: string;
    questions: any[];
    resumeData?: any;
    onComplete?: (results: any) => void;
}

export default function InterviewAgent({
    userId,
    sessionId,
    questions: initialQuestions,
    resumeData,
    onComplete
}: InterviewAgentProps) {
    const [status, setStatus] = useState<"loading" | "ready" | "active" | "paused" | "finished">("loading");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [questions, setQuestions] = useState<any[]>(initialQuestions);
    const [coachMessage, setCoachMessage] = useState("");

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isSpeakingRef = useRef(false);
    const isListeningRef = useRef(false);
    const currentQuestionRef = useRef<any>(null);

    const getFallbackQuestions = () => {
        return [
            {
                id: 1,
                type: "technical",
                question: "Tell me about your experience with programming and what projects you've worked on.",
                hint: "Mention specific technologies and your role in projects",
                timeLimit: 120,
                category: "Experience"
            },
            {
                id: 2,
                type: "behavioral",
                question: "Describe a challenging situation you faced at work and how you handled it.",
                hint: "Use the STAR method: Situation, Task, Action, Result",
                timeLimit: 150,
                category: "Problem Solving"
            },
            {
                id: 3,
                type: "technical",
                question: "What programming languages or frameworks are you most comfortable with and why?",
                hint: "Explain your proficiency level and give examples of use",
                timeLimit: 120,
                category: "Technical Skills"
            }
        ];
    };

    const generateQuestions = async () => {
        try {
            const response = await fetch("/api/generate-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    resumeData,
                    questionCount: 8,
                    difficulty: "mixed"
                })
            });

            const data = await response.json();

            if (data.success && data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
                setStatus("ready");
                setCoachMessage("Questions are ready! Click start when you're prepared.");
            } else {
                // Use fallback questions
                setQuestions(getFallbackQuestions());
                setStatus("ready");
                setCoachMessage("Questions are ready! Click start when you're prepared.");
            }
        } catch (error) {
            console.error("Failed to generate questions:", error);
            setQuestions(getFallbackQuestions());
            setStatus("ready");
            setCoachMessage("Questions are ready! Click start when you're prepared.");
        }
    };

    // Initialize speech
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = "en-US";

                recognitionRef.current.onresult = (e: any) => {
                    let currentTranscript = "";
                    for (let i = e.resultIndex; i < e.results.length; i++) {
                        currentTranscript += e.results[i][0].transcript;
                    }
                    setTranscript(currentTranscript);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                    isListeningRef.current = false;
                };

                recognitionRef.current.onerror = (e: any) => {
                    console.error("Speech recognition error:", e);
                    setIsListening(false);
                    isListeningRef.current = false;
                };
            }

            synthRef.current = window.speechSynthesis;
        }

        // Prepare questions
        if (initialQuestions && initialQuestions.length > 0) {
            setQuestions(initialQuestions);
            setStatus("ready");
            setCoachMessage("Welcome! I'll ask you questions one by one. Take your time to think before answering.");
        } else {
            setCoachMessage("I'm still preparing the questions. One moment.");
            // Try to generate questions
            generateQuestions();
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
    }, [initialQuestions]);

    const speak = useCallback((text: string, callback?: () => void) => {
        if (!synthRef.current) return;

        synthRef.current.cancel();
        setIsSpeaking(true);
        isSpeakingRef.current = true;

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthRef.current.getVoices();
        const voice = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) || voices[0];

        if (voice) utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            if (callback) callback();
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            if (callback) callback();
        };

        synthRef.current.speak(utterance);
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListeningRef.current || isSpeakingRef.current) return;

        try {
            recognitionRef.current.start();
            setIsListening(true);
            isListeningRef.current = true;
            setTranscript("");
        } catch (e) {
            console.error("Failed to start listening:", e);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListeningRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            isListeningRef.current = false;
        }
    }, []);

    const askQuestion = useCallback((questionIndex: number) => {
        if (questionIndex >= questions.length) {
            // Interview complete
            setStatus("finished");
            speak("Thank you for completing the interview! I'll now analyze your responses and provide feedback.", () => {
                if (onComplete) {
                    onComplete({
                        sessionId,
                        answers,
                        questions,
                        completedAt: new Date().toISOString()
                    });
                }
            });
            return;
        }

        const question = questions[questionIndex];
        currentQuestionRef.current = question;
        setCurrentQuestionIndex(questionIndex);

        // Start timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setTimeLeft(question.timeLimit || 120);

        if (question.timeLimit && question.timeLimit > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                        }
                        // Time's up, move to next question
                        handleAnswer("");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        // Ask the question
        const intro = questionIndex === 0
            ? "Let's begin the interview. First question: "
            : `Next question: `;

        speak(intro + question.question, () => {
            // Give a moment, then start listening
            setTimeout(() => {
                startListening();
            }, 1000);
        });
    }, [questions, speak, startListening, onComplete, sessionId, answers]);

    const handleAnswer = useCallback((answer: string) => {
        // Save answer
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer || transcript }));

        stopListening();

        // Move to next question after a brief pause
        setTimeout(() => {
            askQuestion(currentQuestionIndex + 1);
        }, 1500);
    }, [currentQuestionIndex, transcript, askQuestion, stopListening]);

    const startInterview = () => {
        if (status === "ready" && questions.length > 0) {
            setStatus("active");
            askQuestion(0);
        }
    };

    const submitAnswer = () => {
        handleAnswer(transcript);
        setTranscript("");
    };

    const skipQuestion = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        handleAnswer("I'd like to skip this question.");
    };

    const pauseInterview = () => {
        if (status === "active") {
            setStatus("paused");
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (synthRef.current) {
                synthRef.current.pause();
            }
            stopListening();
        }
    };

    const resumeInterview = () => {
        if (status === "paused") {
            setStatus("active");
            if (timeLeft > 0) {
                timerRef.current = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            if (timerRef.current) {
                                clearInterval(timerRef.current);
                            }
                            handleAnswer("");
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
            if (synthRef.current) {
                synthRef.current.resume();
            }
            if (!isSpeaking) {
                startListening();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto py-8">
            {/* Status Bar */}
            <div className="w-full bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-3 h-3 rounded-full",
                            status === "active" ? "bg-green-500 animate-pulse" :
                                status === "paused" ? "bg-yellow-500" :
                                    status === "finished" ? "bg-blue-500" :
                                        "bg-zinc-600"
                        )} />
                        <div>
                            <span className="text-sm font-medium text-zinc-300">
                                {status === "loading" ? "Preparing..." :
                                    status === "ready" ? "Ready to Start" :
                                        status === "active" ? "Interview in Progress" :
                                            status === "paused" ? "Paused" :
                                                "Interview Complete"}
                            </span>
                            <div className="text-xs text-zinc-500">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </div>
                        </div>
                    </div>

                    {status === "active" && timeLeft > 0 && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="font-mono text-lg font-bold text-white">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Agent & Candidate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* AI Agent Card */}
                <Card className={cn(
                    "relative flex flex-col items-center justify-center p-8 transition-all duration-500 overflow-hidden",
                    isSpeaking
                        ? "border-blue-500/50 bg-blue-500/5 scale-[1.02] shadow-2xl shadow-blue-500/10"
                        : "border-zinc-800 bg-zinc-900/40"
                )}>
                    {isSpeaking && (
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                    )}
                    <div className={cn(
                        "relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500",
                        isSpeaking
                            ? "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white shadow-xl shadow-blue-500/40"
                            : "bg-zinc-800 text-zinc-500"
                    )}>
                        <div className={cn(
                            "absolute -inset-2 rounded-full border-2 border-blue-500/20",
                            isSpeaking && "animate-ping"
                        )} />
                        <Bot size={48} />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-white">AI Interview Coach</h3>
                    <p className="text-sm font-medium text-zinc-500 mt-2 uppercase tracking-widest">
                        {isSpeaking ? "Speaking Questions..." : "Ready to Analyze"}
                    </p>

                    {status === "active" && currentQuestion && (
                        <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-5">
                            <div className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2 bg-blue-500/10 px-3 py-1 rounded-full w-fit mx-auto">
                                {currentQuestion.category || "Question"}
                            </div>
                            <div className="text-xl font-medium text-white text-center leading-relaxed">
                                {currentQuestion.question}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Candidate Card */}
                <Card className={cn(
                    "relative flex flex-col items-center justify-center p-8 transition-all duration-500",
                    isListening
                        ? "border-emerald-500/50 bg-emerald-500/5 scale-[1.02] shadow-2xl shadow-emerald-500/10"
                        : "border-zinc-800 bg-zinc-900/40"
                )}>
                    {isListening && (
                        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
                    )}
                    <div className={cn(
                        "relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500",
                        isListening
                            ? "bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-400 text-white shadow-xl shadow-emerald-500/40"
                            : "bg-zinc-800 text-zinc-500"
                    )}>
                        <div className={cn(
                            "absolute -inset-2 rounded-full border-2 border-emerald-500/20",
                            isListening && "animate-ping"
                        )} />
                        <User size={48} />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-white">Your Response</h3>
                    <p className="text-sm font-medium text-zinc-500 mt-2 uppercase tracking-widest">
                        {isListening ? "Listening Now..." : "Wait for Question"}
                    </p>

                    <div className="mt-8 w-full h-32 overflow-y-auto custom-scrollbar bg-black/40 rounded-xl p-4 border border-zinc-800/50">
                        {transcript ? (
                            <div className="text-lg text-emerald-400 leading-relaxed font-medium">
                                "{transcript}"
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600 italic">
                                {isListening ? "Say something..." : "Your transcribed response will appear here"}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Control Panel */}
            <Card className="w-full bg-zinc-900/80 border-zinc-800 p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                    {status === "ready" && (
                        <div className="text-center space-y-6">
                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl max-w-lg">
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    <span className="text-blue-400 font-bold">Coach's Tip:</span> {coachMessage}
                                </p>
                            </div>
                            <Button
                                onClick={startInterview}
                                size="lg"
                                className="h-20 px-16 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
                            >
                                <Play className="mr-3 h-8 w-8 group-hover:fill-current" />
                                BEGIN MOCK INTERVIEW
                            </Button>
                        </div>
                    )}

                    {status === "active" && (
                        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={pauseInterview}
                                    variant="outline"
                                    className="h-14 px-8 border-zinc-700 hover:bg-zinc-800"
                                >
                                    <Pause className="mr-2 h-5 w-5" />
                                    Pause
                                </Button>
                                <Button
                                    onClick={skipQuestion}
                                    variant="ghost"
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <SkipForward className="mr-2 h-5 w-5" />
                                    Skip Question
                                </Button>
                            </div>

                            <Button
                                onClick={submitAnswer}
                                size="lg"
                                className="h-16 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-xl shadow-emerald-900/20"
                                disabled={!transcript && !isListening}
                            >
                                NEXT QUESTION
                                <SkipForward className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    )}

                    {status === "paused" && (
                        <Button
                            onClick={resumeInterview}
                            size="lg"
                            className="h-20 px-16 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-xl font-black shadow-2xl shadow-blue-500/20"
                        >
                            <Play className="mr-3 h-8 w-8" />
                            RESUME SESSION
                        </Button>
                    )}

                    {status === "finished" && (
                        <div className="text-center space-y-6">
                            <div className="flex items-center justify-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-3" />
                                <p className="text-white font-bold">Interview Finished! Preparing your Score Report...</p>
                            </div>
                        </div>
                    )}

                    {status === "active" && (
                        <div className="w-full space-y-3 mt-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                <span>Interview Performance Progress</span>
                                <span>{Math.round(((currentQuestionIndex) / questions.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-in-out"
                                    style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
