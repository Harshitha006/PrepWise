import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function GET() {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                status: "no_api_key",
                message: "GOOGLE_GENERATIVE_AI_API_KEY is not set in .env.local",
                instructions: "Add GOOGLE_GENERATIVE_AI_API_KEY=your_key_here to .env.local"
            });
        }

        // Test connection by getting available models
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            const geminiModels = data.models
                ?.filter((model: any) => model.name.includes("gemini"))
                ?.map((model: any) => model.name) || [];

            return NextResponse.json({
                status: "connected",
                message: "Google AI API is accessible",
                apiKeyConfigured: true,
                apiKeyPreview: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
                availableGeminiModels: geminiModels,
                totalModels: data.models?.length || 0
            });
        } else {
            return NextResponse.json({
                status: "api_error",
                message: "Failed to connect to Google AI API",
                error: await response.text()
            }, { status: response.status });
        }

    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
