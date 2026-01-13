import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { adminDb } from "@/firebase/admin";

// Resume analysis schema
const resumeAnalysisSchema = z.object({
    skills: z.array(z.string()),
    experience: z.string(),
    education: z.array(z.string()),
    jobRole: z.string(),
    atsScore: z.number().min(0).max(100),
    improvements: z.array(z.string()),
    keywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    strengths: z.array(z.string())
});

export async function POST(req: NextRequest) {
    console.log("=== RESUME UPLOAD API CALLED ===");

    try {
        // Check content type
        const contentType = req.headers.get("content-type") || "";
        let resumeText = "";
        let userId = "";

        if (contentType.includes("multipart/form-data")) {
            console.log("Processing file upload...");
            const formData = await req.formData();
            const file = formData.get("resume") as File;
            userId = formData.get("userId") as string;

            if (!file) {
                return NextResponse.json(
                    { success: false, error: "No file provided" },
                    { status: 400 }
                );
            }

            // Read file as text
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            try {
                // Simple text extraction
                resumeText = buffer.toString('utf-8', 0, 10000);

                // Clean up text
                if (resumeText.includes('%PDF')) {
                    // Extract readable text from PDF
                    const lines = resumeText.split('\n').filter(line =>
                        line.trim().length > 10 &&
                        !line.includes('%PDF') &&
                        !line.includes('stream') &&
                        !line.includes('endstream')
                    );
                    resumeText = lines.join('\n').substring(0, 5000);
                }
            } catch (error) {
                console.log("Error reading file:", error);
                resumeText = "PDF file uploaded. For detailed analysis, please paste text directly.";
            }

        } else {
            console.log("Processing text input...");
            const body = await req.json();
            resumeText = body.resumeText || "";
            userId = body.userId || "";

            if (!resumeText.trim()) {
                return NextResponse.json(
                    { success: false, error: "No resume text provided" },
                    { status: 400 }
                );
            }
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User ID is required" },
                { status: 400 }
            );
        }

        // Validate text length
        if (resumeText.length < 50) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Resume text is too short. Please provide at least 50 characters."
                },
                { status: 400 }
            );
        }

        // Clean and prepare text
        const cleanedText = resumeText
            .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-printable characters
            .replace(/\s+/g, ' ')
            .trim();

        const textToAnalyze = cleanedText.substring(0, 3000);
        console.log("Text to analyze length:", textToAnalyze.length);

        // Enhanced fallback analysis with better ATS scoring
        const enhancedFallbackAnalysis = analyzeResumeWithRules(textToAnalyze);

        // Try AI analysis if API key is available
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            try {
                console.log("Attempting AI analysis with Gemini...");

                const google = createGoogleGenerativeAI({
                    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                });

                // Try the most common models
                const modelsToTry = ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro-latest"];

                for (const modelName of modelsToTry) {
                    try {
                        console.log(`Trying model: ${modelName}`);

                        const { object: analysis } = await generateObject({
                            model: google(modelName as any),
                            schema: resumeAnalysisSchema,
                            prompt: `Analyze this resume text:

"${textToAnalyze}"

Provide analysis in this JSON format:
{
  "skills": ["skill1", "skill2"],
  "experience": "X years",
  "education": ["degree1"],
  "jobRole": "job title",
  "atsScore": 0-100,
  "improvements": ["suggestion1"],
  "keywords": ["keyword1"],
  "missingKeywords": ["missing1"],
  "strengths": ["strength1"]
}`,
                            temperature: 0.1,
                        });

                        console.log(`Success with model: ${modelName}`);

                        // Enhance AI analysis with our ATS scoring
                        const atsAnalysis = calculateATSFactors(textToAnalyze);
                        const enhancedAnalysis = {
                            ...analysis,
                            atsScore: Math.round((analysis.atsScore + atsAnalysis.score) / 2), // Average AI and technical score
                            skills: analysis.skills.length > 0 ? analysis.skills : enhancedFallbackAnalysis.skills,
                            experience: (analysis.experience && analysis.experience !== "Experience not specified") ? analysis.experience : enhancedFallbackAnalysis.experience,
                        };

                        // Generate job recommendations
                        let jobRecommendations = "1. Software Developer - Good technical foundation\n2. IT Professional - Based on your skills\n3. Technical Specialist - Entry to mid-level position";

                        try {
                            const jobRecs = await generateText({
                                model: google("gemini-1.5-flash-latest"),
                                prompt: `Based on resume: ${analysis.skills.join(", ")}. Experience: ${analysis.experience}. Suggest 3 job roles.`,
                                temperature: 0.2,
                            });
                            jobRecommendations = jobRecs.text;
                        } catch (recError) {
                            console.log("Job recommendations failed, using default");
                        }

                        // Save to database
                        await saveToDatabase(userId, enhancedAnalysis, jobRecommendations, textToAnalyze);

                        return NextResponse.json({
                            success: true,
                            analysis: enhancedAnalysis,
                            jobRecommendations,
                            resumeId: `ai_${Date.now()}`,
                            message: "AI analysis complete!",
                            debug: { modelUsed: modelName, source: "AI" }
                        });

                    } catch (modelError: any) {
                        console.log(`Model ${modelName} failed:`, modelError.message);
                        continue;
                    }
                }

                // If all AI models failed, use enhanced fallback
                console.log("All AI models failed, using enhanced analysis");

            } catch (aiError: any) {
                console.log("AI system error:", aiError.message);
                // Continue to fallback
            }
        } else {
            console.log("No API key, using enhanced analysis");
        }

        // Use enhanced fallback analysis
        console.log("Using enhanced analysis with ATS scoring");

        // Save to database
        await saveToDatabase(userId, enhancedFallbackAnalysis,
            "1. Technology Professional - Based on your background\n2. Software Developer - Good foundation\n3. IT Specialist - Entry to mid-level\n\nRecommendations: Build portfolio projects, learn in-demand skills, network professionally",
            textToAnalyze
        );

        return NextResponse.json({
            success: true,
            analysis: enhancedFallbackAnalysis,
            jobRecommendations: "1. Technology Professional - Based on your background\n2. Software Developer - Good foundation\n3. IT Specialist - Entry to mid-level\n\nRecommendations: Build portfolio projects, learn in-demand skills, network professionally",
            resumeId: `enhanced_${Date.now()}`,
            message: "Enhanced analysis complete! Your resume has been analyzed.",
            debug: { source: "Enhanced Algorithm" }
        });

    } catch (error: any) {
        console.error("Complete API Error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Analysis failed. Please try pasting text directly.",
                debug: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// Enhanced resume analysis with rules
function analyzeResumeWithRules(text: string): any {
    const atsAnalysis = calculateATSFactors(text);
    const skills = extractSkillsEnhanced(text);
    const experience = extractExperienceEnhanced(text);
    const education = extractEducation(text);
    const jobRole = determineJobRole(text, skills);

    // Calculate improvements based on analysis
    const improvements = generateImprovements(atsAnalysis, skills, text);

    return {
        skills,
        experience,
        education,
        jobRole,
        atsScore: atsAnalysis.score,
        improvements,
        keywords: extractKeywords(text),
        missingKeywords: determineMissingKeywords(skills, jobRole),
        strengths: determineStrengths(skills, experience, text),
        atsBreakdown: atsAnalysis.factors
    };
}

// Enhanced ATS scoring
function calculateATSFactors(text: string): { score: number; factors: any[] } {
    const factors = [];
    let totalScore = 0;

    // 1. Keyword Analysis (25 points)
    const techKeywords = [
        "javascript", "python", "java", "react", "node", "typescript", "html", "css",
        "sql", "git", "aws", "docker", "api", "rest", "graphql", "mongodb", "postgresql",
        "linux", "agile", "scrum"
    ];

    const lowerText = text.toLowerCase();
    let keywordMatches = 0;
    techKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) keywordMatches++;
    });

    const keywordScore = Math.min(25, (keywordMatches / techKeywords.length) * 25);
    factors.push({
        name: "Technical Keywords",
        score: Math.round(keywordScore),
        max: 25,
        found: keywordMatches,
        total: techKeywords.length
    });
    totalScore += keywordScore;

    // 2. Structure (25 points)
    const sections = ["experience", "education", "skills", "projects", "summary", "objective"];
    let sectionCount = 0;
    sections.forEach(section => {
        if (lowerText.includes(section)) sectionCount++;
    });

    const hasDates = /\b(?:20\d{2}|19\d{2})\b/.test(text);
    const hasBulletPoints = /(?:•|◦|○|■|□|▪|▫|→|⇒|›|»|- )/g.test(text);
    const hasMetrics = /\d+%|\$\d+|\d+\+|\b\d+\s*(?:x|times)\b/gi.test(text);

    const structureScore = Math.min(25,
        (sectionCount / 6) * 10 +
        (hasDates ? 5 : 0) +
        (hasBulletPoints ? 5 : 0) +
        (hasMetrics ? 5 : 0)
    );

    factors.push({
        name: "Structure & Formatting",
        score: Math.round(structureScore),
        max: 25,
        sections: sectionCount,
        hasDates,
        hasBulletPoints,
        hasMetrics
    });
    totalScore += structureScore;

    // 3. Content Quality (25 points)
    const contentLength = text.length;
    let lengthScore = 0;
    if (contentLength >= 800 && contentLength <= 2000) lengthScore = 10;
    else if (contentLength > 2000 && contentLength <= 3500) lengthScore = 8;
    else if (contentLength > 3500) lengthScore = 6;
    else lengthScore = 4;

    const hasActionVerbs = /(?:developed|created|built|implemented|designed|optimized|improved|increased|reduced)/gi.test(text);
    const hasContactInfo = /(?:email|phone|linkedin|github|@|\.com)/gi.test(text);
    const hasEducation = /(?:university|college|school|bachelor|master|phd|degree)/gi.test(text);

    const contentScore = Math.min(25,
        lengthScore +
        (hasActionVerbs ? 5 : 0) +
        (hasContactInfo ? 5 : 0) +
        (hasEducation ? 5 : 0)
    );

    factors.push({
        name: "Content Quality",
        score: Math.round(contentScore),
        max: 25,
        length: contentLength,
        hasActionVerbs,
        hasContactInfo,
        hasEducation
    });
    totalScore += contentScore;

    // 4. Relevance (25 points)
    const hasTechSkills = /(?:programming|coding|software|develop|engineer|technical|code)/gi.test(text);
    const hasProjects = /(?:project|built|created|developed)\s+[\w\s]+(?:app|application|system|website)/gi.test(text);
    const hasAchievements = /(?:achieved|accomplished|successfully|awarded|recognized)/gi.test(text);

    const relevanceScore = Math.min(25,
        (hasTechSkills ? 8 : 0) +
        (hasProjects ? 8 : 0) +
        (hasAchievements ? 9 : 0)
    );

    factors.push({
        name: "Relevance & Impact",
        score: Math.round(relevanceScore),
        max: 25,
        hasTechSkills,
        hasProjects,
        hasAchievements
    });
    totalScore += relevanceScore;

    return {
        score: Math.max(0, Math.min(100, Math.round(totalScore))),
        factors
    };
}

// Enhanced skill extraction
function extractSkillsEnhanced(text: string): string[] {
    const skillPatterns = {
        languages: ["javascript", "python", "java", "c#", "c++", "typescript", "go", "rust", "php", "ruby", "swift", "kotlin"],
        frontend: ["react", "angular", "vue", "next.js", "html", "css", "sass", "tailwind", "bootstrap", "material-ui"],
        backend: ["node.js", "express", "django", "flask", "spring", ".net", "laravel", "nest.js"],
        databases: ["mysql", "postgresql", "mongodb", "redis", "firebase", "dynamodb", "cassandra"],
        cloud: ["aws", "azure", "google cloud", "gcp", "docker", "kubernetes", "terraform", "jenkins"],
        tools: ["git", "github", "gitlab", "jira", "confluence", "figma", "postman", "vs code"],
        methodologies: ["agile", "scrum", "kanban", "devops", "ci/cd", "tdd", "microservices"]
    };

    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(skillPatterns).forEach(([category, skills]) => {
        skills.forEach(skill => {
            if (lowerText.includes(skill.toLowerCase())) {
                // Format skill nicely
                const formattedSkill = skill.split('.')[0] // Remove .js etc
                    .split('-')[0] // Remove hyphens
                    .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                foundSkills.push(formattedSkill);
            }
        });
    });

    // Remove duplicates
    const uniqueSkills = [...new Set(foundSkills)];

    // If no technical skills found, look for general terms
    if (uniqueSkills.length === 0) {
        const generalTerms = text.match(/\b(?:tech|software|web|app|code|program|develop|engineer|tech)\b/gi);
        if (generalTerms) {
            return ["Technology", "Software", "Problem Solving", "Communication"];
        }
        return ["Technical Skills", "Problem Solving", "Teamwork"];
    }

    return uniqueSkills.slice(0, 15);
}

function extractExperienceEnhanced(text: string): string {
    // Look for years experience
    const yearPatterns = [
        /(\d+)\+?\s*(?:years?|yrs?)(?:\s*\+\s*\d+\s*months?)?/i,
        /(\d+)\s*\+\s*(?:years?|yrs?)/i,
        /experience.*?(\d+)/i,
        /(\d+)\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i
    ];

    for (const pattern of yearPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const years = parseInt(match[1]);
            if (years >= 0) {
                return `${years} year${years > 1 ? 's' : ''}`;
            }
        }
    }

    // Look for seniority indicators
    if (text.toLowerCase().includes("senior") || text.toLowerCase().includes("lead")) return "5+ years";
    if (text.toLowerCase().includes("mid") || text.toLowerCase().includes("level iii")) return "3-5 years";
    if (text.toLowerCase().includes("junior") || text.toLowerCase().includes("entry")) return "0-2 years";

    // Look for dates
    const datePattern = /(?:20\d{2}|19\d{2})\s*[-–]\s*(?:present|current|now|20\d{2}|19\d{2})/gi;
    const dates = text.match(datePattern);
    if (dates && dates.length >= 1) return "Multiple years";

    return "Experience not specified";
}

function extractEducation(text: string): string[] {
    const education = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes("bachelor") || lowerText.includes("b.s.") || lowerText.includes("b.a.")) {
        education.push("Bachelor's Degree");
    }
    if (lowerText.includes("master") || lowerText.includes("m.s.") || lowerText.includes("m.a.")) {
        education.push("Master's Degree");
    }
    if (lowerText.includes("phd") || lowerText.includes("doctorate")) {
        education.push("PhD");
    }
    if (lowerText.includes("associate") || lowerText.includes("a.s.") || lowerText.includes("a.a.")) {
        education.push("Associate Degree");
    }

    // Look for specific schools
    const schoolPatterns = [/university/i, /college/i, /institute/i, /school/i];
    schoolPatterns.forEach(pattern => {
        if (pattern.test(text)) {
            education.push("Higher Education");
        }
    });

    return education.length > 0 ? education : ["Education details not specified"];
}

function determineJobRole(text: string, skills: string[]): string {
    const lowerText = text.toLowerCase();

    // Check for role mentions
    const rolePatterns = [
        { pattern: /(?:software|web|application)\s+(?:engineer|developer)/i, role: "Software Engineer" },
        { pattern: /frontend|front-end/i, role: "Frontend Developer" },
        { pattern: /backend|back-end/i, role: "Backend Developer" },
        { pattern: /full.?stack/i, role: "Full Stack Developer" },
        { pattern: /devops/i, role: "DevOps Engineer" },
        { pattern: /data\s+scientist/i, role: "Data Scientist" },
        { pattern: /data\s+engineer/i, role: "Data Engineer" },
        { pattern: /machine\s+learning|ml\s+engineer/i, role: "Machine Learning Engineer" },
        { pattern: /cloud\s+engineer/i, role: "Cloud Engineer" },
        { pattern: /qa\s+engineer|test\s+engineer/i, role: "QA Engineer" }
    ];

    for (const { pattern, role } of rolePatterns) {
        if (pattern.test(text)) {
            return role;
        }
    }

    // Determine based on skills
    const skillText = skills.join(' ').toLowerCase();

    if (skillText.includes("react") || skillText.includes("angular") || skillText.includes("vue")) {
        return "Frontend Developer";
    }
    if (skillText.includes("node") || skillText.includes("python") || skillText.includes("java")) {
        return "Backend Developer";
    }
    if ((skillText.includes("react") || skillText.includes("frontend")) &&
        (skillText.includes("node") || skillText.includes("backend"))) {
        return "Full Stack Developer";
    }
    if (skillText.includes("aws") || skillText.includes("azure") || skillText.includes("docker")) {
        return "Cloud Engineer";
    }

    return "Software Developer";
}

function extractKeywords(text: string): string[] {
    const commonKeywords = [
        "development", "programming", "software", "web", "application",
        "design", "implementation", "testing", "deployment", "maintenance",
        "collaboration", "problem-solving", "communication", "teamwork"
    ];

    const foundKeywords: string[] = [];
    const lowerText = text.toLowerCase();

    commonKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            foundKeywords.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
    });

    return foundKeywords.length > 0 ? foundKeywords : ["Technical", "Development", "Problem Solving"];
}

function determineMissingKeywords(skills: string[], jobRole: string): string[] {
    const roleKeywords: Record<string, string[]> = {
        "Software Engineer": ["System Design", "Algorithms", "Data Structures", "OOP", "Design Patterns"],
        "Frontend Developer": ["Responsive Design", "Web Performance", "Accessibility", "Cross-browser", "State Management"],
        "Backend Developer": ["API Design", "Database Optimization", "Security", "Scalability", "Microservices"],
        "Full Stack Developer": ["End-to-end Development", "CI/CD", "Deployment", "Monitoring", "Architecture"],
        "DevOps Engineer": ["Infrastructure", "Automation", "Monitoring", "Security", "Cloud Native"],
        "Cloud Engineer": ["AWS Services", "Infrastructure as Code", "Networking", "Security", "Cost Optimization"]
    };

    const missing = roleKeywords[jobRole] || [
        "Cloud Computing", "Containerization", "CI/CD", "Agile Methodology", "System Design"
    ];

    // Filter out skills the user already has
    const userSkillsLower = skills.map(s => s.toLowerCase());
    return missing.filter(keyword =>
        !userSkillsLower.some(skill =>
            skill.includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(skill)
        )
    ).slice(0, 5);
}

function determineStrengths(skills: string[], experience: string, text: string): string[] {
    const strengths = [];
    const lowerText = text.toLowerCase();

    if (skills.length >= 5) strengths.push("Strong technical skill set");
    if (experience !== "Experience not specified") strengths.push("Professional experience");
    if (lowerText.includes("project") || lowerText.includes("built")) strengths.push("Project development experience");
    if (lowerText.includes("team") || lowerText.includes("collaborat")) strengths.push("Team collaboration");
    if (lowerText.includes("problem") || lowerText.includes("solve")) strengths.push("Problem-solving ability");

    return strengths.length > 0 ? strengths : ["Technical aptitude", "Learning capability", "Communication skills"];
}

function generateImprovements(atsAnalysis: any, skills: string[], text: string): string[] {
    const improvements = [];
    const lowerText = text.toLowerCase();

    // Based on ATS score
    if (atsAnalysis.score < 70) {
        improvements.push("Increase keyword density for better ATS parsing");
    }

    // Based on content
    if (!/\d+%|\$\d+|\d+\+/i.test(text)) {
        improvements.push("Add quantifiable achievements with numbers and metrics");
    }

    if (skills.length < 5) {
        improvements.push("Include more technical skills and tools relevant to your target role");
    }

    if (!lowerText.includes("achieved") && !lowerText.includes("accomplished")) {
        improvements.push("Highlight specific achievements and results");
    }

    if (text.length < 500) {
        improvements.push("Expand on your experience and responsibilities");
    }

    // Default improvements
    const defaultImprovements = [
        "Use action verbs to start bullet points (Developed, Created, Implemented)",
        "Include relevant certifications and training",
        "Optimize formatting for better readability",
        "Tailor content to specific job applications"
    ];

    // Return 3-5 improvements
    return [...improvements, ...defaultImprovements]
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 4);
}

// Save to database
async function saveToDatabase(userId: string, analysis: any, jobRecommendations: string, resumeText: string) {
    if (!adminDb) {
        console.log("Database not available, skipping save");
        return;
    }

    try {
        // Save resume analysis
        const resumeRef = await adminDb.collection("resumes").add({
            userId,
            uploadDate: new Date().toISOString(),
            analysis,
            jobRecommendations,
            textPreview: resumeText.substring(0, 500),
            status: "analyzed",
            analysisType: analysis.atsBreakdown ? "Enhanced Algorithm" : "AI Analysis",
            createdAt: new Date().toISOString()
        });

        // Update user profile
        await adminDb.collection("users").doc(userId).set({
            hasResume: true,
            lastResumeUpdate: new Date().toISOString(),
            skills: analysis.skills,
            experience: analysis.experience,
            preferredRole: analysis.jobRole,
            atsScore: analysis.atsScore,
            currentResumeId: resumeRef.id,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log("Saved to database successfully");

    } catch (dbError: any) {
        console.error("Database save error:", dbError);
    }
}

export async function GET() {
    return NextResponse.json({
        status: "active",
        message: "Resume upload API is working",
        supports: ["text input", "file upload"],
        enhancedAnalysis: true,
        timestamp: new Date().toISOString()
    });
}
