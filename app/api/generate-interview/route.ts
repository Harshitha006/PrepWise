import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { adminDb } from "@/firebase/admin";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, resumeData, difficulty = "mixed", questionCount = 10 } = body;

        console.log("Generating interview for user:", userId);
        console.log("Resume data:", resumeData?.jobRole, resumeData?.skills?.length);

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User ID is required" },
                { status: 400 }
            );
        }

        // Get or generate questions
        let questions = [];

        if (resumeData) {
            // Generate personalized questions based on resume
            questions = await generatePersonalizedQuestions(resumeData, questionCount, difficulty);
        } else {
            // Fallback: Use generic questions
            questions = getFallbackQuestions();
        }

        // Create interview session
        const sessionData = {
            userId,
            questions,
            currentQuestionIndex: 0,
            status: "active",
            startedAt: new Date().toISOString(),
            resumeData: resumeData || {},
            difficulty,
            questionCount
        };

        let sessionId;
        if (adminDb) {
            const sessionRef = await adminDb.collection("interviewSessions").add(sessionData);
            sessionId = sessionRef.id;

            // Update session with ID
            await sessionRef.update({ sessionId: sessionRef.id });
        } else {
            sessionId = `mock_${Date.now()}`;
        }

        return NextResponse.json({
            success: true,
            sessionId,
            questions,
            message: "Interview generated successfully"
        });

    } catch (error: any) {
        console.error("Interview generation error:", error);

        // Return fallback questions
        const fallbackQuestions = getFallbackQuestions();

        return NextResponse.json({
            success: true,
            sessionId: `fallback_${Date.now()}`,
            questions: fallbackQuestions,
            message: "Using prepared interview questions"
        });
    }
}

async function generatePersonalizedQuestions(resumeData: any, count: number, difficulty: string): Promise<any[]> {
    try {
        const { jobRole, skills = [], experience = "", strengths = [] } = resumeData;

        console.log("Generating personalized questions for:", jobRole);

        // Prepare prompt for AI
        const prompt = `You are an expert technical interviewer. Generate ${count} interview questions for a candidate with this profile:

TARGET ROLE: ${jobRole}
SKILLS: ${skills.slice(0, 10).join(", ")}${skills.length > 10 ? ` and ${skills.length - 10} more skills` : ''}
EXPERIENCE: ${experience}
STRENGTHS: ${strengths.slice(0, 3).join(", ")}
DIFFICULTY LEVEL: ${difficulty}

Generate questions in this format (JSON array):
[
  {
    "id": 1,
    "type": "technical|behavioral|scenario",
    "question": "The question text here",
    "hint": "Optional hint for the candidate",
    "expectedKeywords": ["keyword1", "keyword2"],
    "timeLimit": 120
  }
]

Requirements:
1. Mix of question types: 40% technical, 30% behavioral, 30% scenario-based
2. Technical questions should cover: ${skills.slice(0, 3).join(", ")}
3. Include questions about their experience level: ${experience}
4. ${difficulty === "hard" ? "Include advanced system design questions" : difficulty === "mixed" ? "Mix of easy, medium, and hard questions" : "Focus on fundamental concepts"}
5. Include 1-2 questions about communication and teamwork

Return ONLY the JSON array, no other text.`;

        console.log("Calling AI for questions...");

        const response = await generateText({
            model: google("gemini-1.5-flash-latest"),
            prompt,
            temperature: 0.7,
        });

        console.log("AI response received");

        // Parse the response
        try {
            // Clean up response if it has markdown code blocks
            let text = response.text;
            if (text.includes("```json")) {
                text = text.split("```json")[1].split("```")[0];
            } else if (text.includes("```")) {
                text = text.split("```")[1].split("```")[0];
            }

            const questions = JSON.parse(text);
            return questions.map((q: any, index: number) => ({
                id: index + 1,
                type: q.type || "technical",
                question: q.question,
                hint: q.hint || "",
                expectedKeywords: q.expectedKeywords || [],
                timeLimit: q.timeLimit || 120,
                category: getCategory(q.type || "technical")
            }));
        } catch (parseError) {
            console.log("Failed to parse AI response, using fallback:", parseError);
            return getFallbackQuestions();
        }

    } catch (aiError) {
        console.log("AI generation failed, using fallback:", aiError);
        return getFallbackQuestions();
    }
}

function getFallbackQuestions() {
    return [
        {
            id: 1,
            type: "technical",
            question: "Tell me about your experience with programming languages. Which ones are you most proficient in?",
            hint: "Mention specific languages and your experience level with each",
            expectedKeywords: ["JavaScript", "Python", "Java", "experience", "projects"],
            timeLimit: 120,
            category: "Technical Fundamentals"
        },
        {
            id: 2,
            type: "technical",
            question: "Describe a challenging technical problem you solved recently. What was your approach?",
            hint: "Use the STAR method: Situation, Task, Action, Result",
            expectedKeywords: ["problem-solving", "debugging", "solution", "results"],
            timeLimit: 180,
            category: "Problem Solving"
        },
        {
            id: 3,
            type: "behavioral",
            question: "Tell me about a time you had to work on a team project. What was your role and contribution?",
            hint: "Focus on collaboration, communication, and outcomes",
            expectedKeywords: ["teamwork", "collaboration", "communication", "contribution"],
            timeLimit: 150,
            category: "Teamwork"
        },
        {
            id: 4,
            type: "scenario",
            question: "Imagine you're building a web application that needs to handle 10,000 concurrent users. How would you approach the architecture?",
            hint: "Consider scalability, performance, and technology choices",
            expectedKeywords: ["scalability", "architecture", "performance", "load balancing"],
            timeLimit: 240,
            category: "System Design"
        },
        {
            id: 5,
            type: "technical",
            question: "What's the difference between REST and GraphQL APIs? When would you choose one over the other?",
            hint: "Compare their use cases, advantages, and limitations",
            expectedKeywords: ["REST", "GraphQL", "APIs", "comparison", "use cases"],
            timeLimit: 150,
            category: "API Design"
        },
        {
            id: 6,
            type: "behavioral",
            question: "Describe a situation where you had to learn a new technology quickly. How did you approach it?",
            hint: "Talk about your learning process and how you applied the new knowledge",
            expectedKeywords: ["learning", "adaptability", "new technology", "implementation"],
            timeLimit: 120,
            category: "Learning Ability"
        },
        {
            id: 7,
            type: "technical",
            question: "Explain how you would optimize a slow database query in a production application.",
            hint: "Consider indexing, query optimization, caching strategies",
            expectedKeywords: ["database", "optimization", "indexing", "performance", "caching"],
            timeLimit: 180,
            category: "Database"
        },
        {
            id: 8,
            type: "scenario",
            question: "You discover a critical bug in production right before a major release. What do you do?",
            hint: "Consider priorities, communication, and problem-solving steps",
            expectedKeywords: ["bug fixing", "production", "prioritization", "communication"],
            timeLimit: 150,
            category: "Crisis Management"
        },
        {
            id: 9,
            type: "technical",
            question: "What are some best practices for writing maintainable code?",
            hint: "Think about coding standards, documentation, testing, and architecture",
            expectedKeywords: ["maintainability", "clean code", "documentation", "testing", "standards"],
            timeLimit: 120,
            category: "Code Quality"
        },
        {
            id: 10,
            type: "behavioral",
            question: "Where do you see yourself in 5 years? What are your career goals?",
            hint: "Be honest about your aspirations and how they align with the role",
            expectedKeywords: ["career goals", "growth", "aspirations", "development"],
            timeLimit: 120,
            category: "Career Goals"
        }
    ];
}

function getCategory(type: string): string {
    const categories: Record<string, string> = {
        technical: "Technical Skills",
        behavioral: "Behavioral",
        scenario: "Scenario Based",
        fundamentals: "Technical Fundamentals",
        system: "System Design",
        coding: "Coding Problem"
    };
    return categories[type] || "General";
}
