import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
      category: z.string(),
      expectedKeywords: z.array(z.string()),
      timeLimit: z.number().optional(),
      followUp: z.array(z.string()).optional(),
    }),
  ),
});

type Question = z.infer<typeof questionSchema>["questions"][number];

export async function POST(req: NextRequest) {
  try {
    const { role, skills, experience, difficulty } = await req.json();

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const prompt = `Generate 10 interview questions for a ${role || "Software Engineer"} position.

Candidate Details:
- Skills: ${(skills || []).join(", ")}
- Experience Level: ${experience || "Not specified"} years
- Desired Difficulty: ${difficulty || "MEDIUM"}

For each question provide:
1. The question text
2. Difficulty level (EASY/MEDIUM/HARD)
3. Category (Technical/Behavioral/System Design/Problem Solving)
4. Expected keywords in the answer
5. Suggested time limit in minutes
6. Possible follow-up questions

Make questions specific to the role and relevant to skills.
Return valid JSON only as: {"questions": [...]}.`;

      const { text } = await generateText({
        model: google("gemini-1.5-pro-latest"),
        prompt,
        temperature: 0.4,
      });

      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      const validated = questionSchema.parse(parsed);
      const breakdown = getDifficultyBreakdown(validated.questions);

      return NextResponse.json({
        success: true,
        questions: validated.questions,
        metadata: {
          role,
          totalQuestions: validated.questions.length,
          difficultyBreakdown: breakdown,
        },
      });
    }

    const fallbackQuestions = getFallbackQuestions(role, skills);
    return NextResponse.json({ success: true, questions: fallbackQuestions, isFallback: true });
  } catch (error) {
    console.error("❌ Question generation failed:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to generate questions",
      fallback: {
        questions: [
          {
            question: "Tell me about your experience with relevant technologies.",
            difficulty: "MEDIUM",
            category: "Technical",
            expectedKeywords: ["experience", "project", "challenge"],
            timeLimit: 5,
          },
        ],
      },
    });
  }
}

function getDifficultyBreakdown(questions: Question[]): Record<"EASY" | "MEDIUM" | "HARD", number> {
  const breakdown = { EASY: 0, MEDIUM: 0, HARD: 0 };
  questions.forEach((q) => {
    breakdown[q.difficulty] += 1;
  });
  return breakdown;
}

function getFallbackQuestions(role: string = "Software Developer", skills: string[] = []): Question[] {
  const baseQuestions: Question[] = [
    {
      question: `What interests you most about the ${role} position?`,
      difficulty: "EASY",
      category: "Behavioral",
      expectedKeywords: ["passion", "interest", "career"],
      timeLimit: 3,
    },
    {
      question: `Describe a challenging project you worked on using ${skills?.[0] || "your main technology"}.`,
      difficulty: "MEDIUM",
      category: "Technical",
      expectedKeywords: ["challenge", "solution", "learning"],
      timeLimit: 7,
    },
  ];

  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("frontend") || lowerRole.includes("react")) {
    baseQuestions.push({
      question: "How do you manage state in a large React application?",
      difficulty: "HARD",
      category: "Technical",
      expectedKeywords: ["redux", "context", "state management", "performance"],
      timeLimit: 10,
      followUp: ["How would you choose between Redux and Context API?"],
    });
  } else if (lowerRole.includes("backend")) {
    baseQuestions.push({
      question: "How would you design a scalable RESTful API?",
      difficulty: "HARD",
      category: "System Design",
      expectedKeywords: ["scalability", "caching", "database", "load balancing"],
      timeLimit: 15,
      followUp: ["How would you handle rate limiting?"],
    });
  }

  return baseQuestions;
}
