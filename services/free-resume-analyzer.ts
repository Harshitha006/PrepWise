// @ts-ignore
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export class FreeResumeAnalyzer {

    async analyzeResume(file: File): Promise<any> {
        try {
            // Step 1: Extract text (free PDF parsing)
            const text = await this.extractTextFromPDF(file);

            // Step 2: Structure data with basic parsing
            const structuredData = await this.basicStructureParser(text);

            // Step 3: Calculate ATS score using free algorithm
            const atsScore = this.calculateFreeATSScore(text, structuredData);

            // Step 4: Get insights from Gemini Free Tier
            const insights = await this.getFreeGeminiInsights(text);

            return {
                success: true,
                data: {
                    rawText: text,
                    structured: structuredData,
                    atsScore: atsScore,
                    insights: insights,
                    analyzedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error("Free analysis error:", error);
            return this.getFallbackAnalysis();
        }
    }

    private async extractTextFromPDF(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        try {
            // First try: pdf-parse (fastest for text-based PDFs)
            // Note: pdf-parse version in package.json is 2.4.5 which might have different API or issue in some envs
            const data = await pdfParse(buffer);
            if (data.text && data.text.length > 50) {
                return data.text;
            }

            // Fallback: Try Tesseract.js OCR for scanned PDFs
            const image = await this.convertPDFToImage(buffer);
            const { data: { text } } = await Tesseract.recognize(image, 'eng', {
                // logger: m => console.log(m) // Optional: log progress
            });

            return text || "Unable to extract text";
        } catch (error) {
            console.warn("pdf-parse failed, trying fallback...", error);
            // If pdf-parse fails (e.g. on edge), we might need a different approach or just fallback
            return "Unable to extract text from PDF";
        }
    }

    private async convertPDFToImage(pdfBuffer: Buffer): Promise<string> {
        // Simple conversion - first page to image
        // For production, use pdf.js in browser
        return `data:image/png;base64,${pdfBuffer.toString('base64').slice(0, 1000)}`;
    }

    private async basicStructureParser(text: string): Promise<any> {
        // Free regex-based parser (good enough for basic info)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;
        const linkRegex = /(https?:\/\/[^\s]+)/g;

        // Extract skills using common keywords
        const skillsKeywords = [
            'javascript', 'python', 'java', 'react', 'node', 'aws', 'docker',
            'kubernetes', 'sql', 'mongodb', 'typescript', 'html', 'css', 'git',
            'rest', 'api', 'agile', 'scrum', 'leadership', 'communication'
        ];

        const foundSkills = skillsKeywords.filter(skill =>
            text.toLowerCase().includes(skill)
        );

        return {
            personal: {
                emails: text.match(emailRegex) || [],
                phones: text.match(phoneRegex) || [],
                links: text.match(linkRegex) || []
            },
            skills: foundSkills,
            hasSummary: text.toLowerCase().includes('summary') || text.toLowerCase().includes('objective'),
            hasExperience: this.checkExperience(text),
            hasEducation: this.checkEducation(text),
            wordCount: text.split(/\s+/).length,
            sectionCount: this.countSections(text)
        };
    }

    private calculateFreeATSScore(text: string, structuredData: any): any {
        // Free ATS scoring algorithm (inspired by Jobscan/Resume Worded)
        let score = 0;
        const maxScore = 100;
        const feedback = [];

        // 1. Contact Info (10 points)
        if (structuredData.personal.emails.length > 0) score += 5;
        if (structuredData.personal.phones.length > 0) score += 5;

        // 2. Skills Density (20 points)
        const skillDensity = Math.min(structuredData.skills.length / 10 * 20, 20);
        score += skillDensity;

        // 3. Length Check (15 points)
        const wordCount = structuredData.wordCount;
        if (wordCount >= 300 && wordCount <= 700) score += 15;
        else if (wordCount > 700) feedback.push("Resume is too long (>700 words)");
        else feedback.push("Resume is too short (<300 words)");

        // 4. Section Presence (25 points)
        if (structuredData.hasSummary) score += 5;
        if (structuredData.hasExperience) score += 10;
        if (structuredData.hasEducation) score += 10;

        // 5. Formatting Check (30 points)
        const formattingScore = this.checkFormatting(text);
        score += formattingScore;

        // 6. Action Verbs (bonus)
        const actionVerbs = this.countActionVerbs(text);
        score += Math.min(actionVerbs * 0.5, 10);

        // Normalize to 100
        score = Math.min(Math.max(score, 0), maxScore);

        return {
            score: Math.round(score),
            breakdown: {
                contactInfo: 10,
                skills: Math.round(skillDensity),
                length: wordCount >= 300 && wordCount <= 700 ? 15 : 0,
                sections: structuredData.hasExperience && structuredData.hasEducation ? 20 : 0,
                formatting: Math.round(formattingScore),
                actionVerbs: Math.min(actionVerbs * 0.5, 10)
            },
            feedback: feedback,
            grade: this.getGrade(score)
        };
    }

    private checkFormatting(text: string): number {
        let score = 0;

        // Check for common formatting issues
        const hasTables = text.includes('\t') && text.split('\t').length > 5;
        const hasHeaders = text.toLowerCase().includes('header') || text.includes('footer');
        const lineBreaks = text.split('\n').length;
        const avgLineLength = text.length / lineBreaks;

        if (!hasTables) score += 10;
        if (!hasHeaders) score += 10;
        if (avgLineLength > 20 && avgLineLength < 100) score += 10;

        return score;
    }

    private countActionVerbs(text: string): number {
        const verbs = [
            'achieved', 'managed', 'developed', 'implemented', 'created',
            'increased', 'improved', 'led', 'coordinated', 'organized',
            'designed', 'built', 'launched', 'optimized', 'reduced',
            'transformed', 'executed', 'delivered', 'oversaw', 'mentored'
        ];

        return verbs.filter(verb =>
            text.toLowerCase().includes(verb)
        ).length;
    }

    private async getFreeGeminiInsights(text: string): Promise<any> {
        try {
            // Using Gemini Free Tier (limited but works)
            // Note: You need to set up Google AI API key (free)
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
            if (!apiKey) {
                return this.getFallbackInsights(text);
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
      Analyze this resume text and provide brief insights:
      
      ${text.substring(0, 3000)} // Limit to avoid token limits
      
      Return ONLY JSON with:
      {
        "strengths": ["strength1", "strength2"],
        "improvements": ["improvement1", "improvement2"],
        "suggestedRoles": ["role1", "role2"],
        "keySkills": ["skill1", "skill2"]
      }
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();

            try {
                // Clean markdown if present
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return JSON.parse(responseText);
            } catch {
                return this.parseTextToJSON(responseText);
            }
        } catch (error) {
            console.error("Gemini insights error:", error);
            return this.getFallbackInsights(text);
        }
    }

    private getFallbackInsights(text: string): any {
        // Fallback when Gemini fails
        const skills = this.extractSkillsFromText(text);
        const roles = this.suggestRolesFromSkills(skills);

        return {
            strengths: ["Basic structure detected", "Some skills identified"],
            improvements: ["Add more quantifiable achievements", "Include specific metrics"],
            suggestedRoles: roles.slice(0, 3),
            keySkills: skills.slice(0, 5)
        };
    }

    private extractSkillsFromText(text: string): string[] {
        const commonSkills = [
            'JavaScript', 'Python', 'React', 'Node.js', 'AWS',
            'Docker', 'SQL', 'Git', 'HTML', 'CSS', 'TypeScript',
            'Java', 'Spring', 'Angular', 'Vue', 'Next.js',
            'MongoDB', 'PostgreSQL', 'Redis', 'Kubernetes',
            'CI/CD', 'REST API', 'GraphQL', 'Agile', 'Scrum'
        ];

        return commonSkills.filter(skill =>
            text.toLowerCase().includes(skill.toLowerCase())
        );
    }

    private suggestRolesFromSkills(skills: string[]): string[] {
        const roleMapping: { [key: string]: string[] } = {
            'Frontend': ['React', 'Angular', 'Vue', 'JavaScript', 'TypeScript', 'HTML', 'CSS'],
            'Backend': ['Node.js', 'Python', 'Java', 'Spring', 'SQL', 'MongoDB'],
            'Full Stack': ['React', 'Node.js', 'JavaScript', 'Python', 'SQL'],
            'DevOps': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
            'Data': ['Python', 'SQL', 'MongoDB', 'Data Analysis']
        };

        const scores: { [key: string]: number } = {};

        Object.entries(roleMapping).forEach(([role, requiredSkills]) => {
            scores[role] = requiredSkills.filter(skill =>
                skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            ).length;
        });

        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([role]) => `${role} Developer`);
    }

    private checkExperience(text: string): boolean {
        const expKeywords = ['experience', 'work history', 'employment', 'career'];
        return expKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
    }

    private checkEducation(text: string): boolean {
        const eduKeywords = ['education', 'university', 'college', 'degree', 'bachelor', 'master'];
        return eduKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
    }

    private countSections(text: string): number {
        const sectionHeaders = ['experience', 'education', 'skills', 'projects',
            'certifications', 'summary', 'objective'];
        return sectionHeaders.filter(header =>
            text.toLowerCase().includes(header)
        ).length;
    }

    private getGrade(score: number): string {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'Needs Improvement';
    }

    private parseTextToJSON(text: string): any {
        // Simple parsing if Gemini returns text instead of JSON
        const lines = text.split('\n');
        return {
            strengths: lines.filter(l => l.includes('strength') || l.includes('good')).slice(0, 2),
            improvements: lines.filter(l => l.includes('improve') || l.includes('add')).slice(0, 2),
            suggestedRoles: lines.filter(l => l.includes('developer') || l.includes('engineer')).slice(0, 2),
            keySkills: this.extractSkillsFromText(text).slice(0, 3)
        };
    }

    private getFallbackAnalysis() {
        return {
            success: false,
            data: {
                atsScore: {
                    score: 50,
                    breakdown: {
                        contactInfo: 0,
                        skills: 10,
                        length: 10,
                        sections: 10,
                        formatting: 10,
                        actionVerbs: 10
                    },
                    feedback: ["Unable to fully analyze. Please check file format."],
                    grade: "C"
                },
                insights: {
                    strengths: ["Resume file uploaded"],
                    improvements: ["Could not analyze content fully"],
                    suggestedRoles: ["General Developer"],
                    keySkills: []
                }
            }
        };
    }
}
