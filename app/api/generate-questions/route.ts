import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
    console.log("=== GENERATE QUESTIONS API CALLED ===");

    try {
        const body = await req.json();
        const { role, skills, experience, jobRequirements } = body;

        console.log("Generating questions for:", role, skills?.length);

        // Always return questions immediately - don't wait for AI
        const questions = getQuestionsByRole(role, skills, experience);

        return NextResponse.json({
            success: true,
            questions,
            message: "Questions generated successfully"
        });

        /* UNCOMMENT THIS IF YOU WANT TO USE AI (with correct model names)
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          try {
            const google = createGoogleGenerativeAI({
              apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
    
            // Use correct model names
            const modelNames = [
              "gemini-1.5-pro-latest",  // Most capable
              "gemini-pro",             // Alternative
              "gemini-1.0-pro-latest",  // Basic
            ];
    
            for (const modelName of modelNames) {
              try {
                console.log(`Trying model: ${modelName}`);
                
                const response = await generateText({
                  model: google(modelName as any),
                  prompt: `Generate 10 interview questions for a ${role} position. 
                  Skills: ${skills?.join(", ") || "General technical skills"}
                  Experience: ${experience || "Not specified"}
                  
                  Return as a JSON array of strings.`,
                  temperature: 0.7,
                  maxTokens: 1000,
                });
    
                console.log("AI response received");
                
                try {
                  const parsedQuestions = JSON.parse(response.text);
                  if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                    return NextResponse.json({
                      success: true,
                      questions: parsedQuestions,
                      message: "AI-generated questions",
                      modelUsed: modelName
                    });
                  }
                } catch (parseError) {
                  console.log("Failed to parse AI response");
                }
              } catch (modelError) {
                console.log(`Model ${modelName} failed`);
                continue;
              }
            }
          } catch (aiError) {
            console.log("AI failed completely:", aiError);
          }
        }
    
        // Fallback to rule-based questions
        const questions = getQuestionsByRole(role, skills, experience);
        
        return NextResponse.json({
          success: true,
          questions,
          message: "Questions generated using rule-based system"
        });
        */

    } catch (error: any) {
        console.error("Questions generation error:", error);

        // Always return questions
        const questions = getFallbackQuestions();

        return NextResponse.json({
            success: true,
            questions,
            message: "Questions generated (fallback)"
        });
    }
}

function getQuestionsByRole(role: string = "Software Developer", skills: string[] = [], experience: string = ""): string[] {
    const roleQuestions: Record<string, string[]> = {
        "Software Engineer": [
            "Tell me about your experience with object-oriented programming.",
            "How do you approach debugging a complex issue?",
            "What's your experience with version control systems?",
            "Describe a challenging project you worked on.",
            "How do you ensure code quality in your projects?",
            "What's your experience with testing methodologies?",
            "How do you stay updated with new technologies?",
            "Describe your experience with databases.",
            "How do you handle tight deadlines?",
            "What are your career goals?"
        ],
        "Frontend Developer": [
            "What's your experience with modern JavaScript frameworks?",
            "How do you ensure responsive design?",
            "Describe your CSS methodology.",
            "How do you optimize web performance?",
            "What's your experience with state management?",
            "How do you handle cross-browser compatibility?",
            "Describe your experience with build tools.",
            "How do you approach accessibility?",
            "What's your experience with testing frontend code?",
            "How do you collaborate with designers?"
        ],
        "Backend Developer": [
            "Describe your experience with server-side programming.",
            "How do you design RESTful APIs?",
            "What's your experience with databases?",
            "How do you handle authentication and authorization?",
            "Describe your experience with caching strategies.",
            "How do you ensure application security?",
            "What's your experience with message queues?",
            "How do you monitor application performance?",
            "Describe your experience with cloud platforms.",
            "How do you handle data migration?"
        ],
        "Full Stack Developer": [
            "How do you balance frontend and backend development?",
            "Describe your experience with end-to-end development.",
            "How do you ensure consistency across the stack?",
            "What's your approach to API design?",
            "How do you handle deployment and DevOps?",
            "Describe your experience with database design.",
            "How do you optimize full-stack performance?",
            "What's your experience with microservices?",
            "How do you handle security across layers?",
            "Describe your project architecture decisions."
        ]
    };

    // Determine role category
    const lowerRole = role.toLowerCase();
    let selectedRole = "Software Engineer";

    if (lowerRole.includes("frontend") || lowerRole.includes("react") || lowerRole.includes("angular") || lowerRole.includes("vue")) {
        selectedRole = "Frontend Developer";
    } else if (lowerRole.includes("backend") || lowerRole.includes("node") || lowerRole.includes("api") || lowerRole.includes("server")) {
        selectedRole = "Backend Developer";
    } else if (lowerRole.includes("full stack") || lowerRole.includes("full-stack")) {
        selectedRole = "Full Stack Developer";
    }

    const questions = roleQuestions[selectedRole] || roleQuestions["Software Engineer"];

    // Personalize questions based on skills
    if (skills && skills.length > 0) {
        const skillQuestions = skills.slice(0, 3).map(skill =>
            `What's your experience with ${skill}?`
        );
        return [...skillQuestions, ...questions.slice(skillQuestions.length)];
    }

    return questions;
}

function getFallbackQuestions(): string[] {
    return [
        "Tell me about yourself and your technical background.",
        "What programming languages are you most comfortable with?",
        "Describe a challenging technical problem you solved.",
        "How do you approach learning new technologies?",
        "What's your experience with version control?",
        "How do you handle working in a team?",
        "What are your strengths as a developer?",
        "How do you handle feedback on your code?",
        "What's your experience with agile methodologies?",
        "Where do you see yourself in 5 years?"
    ];
}

export async function GET() {
    return NextResponse.json({
        status: "active",
        message: "Questions generation API is working",
        supports: ["POST with role, skills, experience"],
        timestamp: new Date().toISOString()
    });
}
