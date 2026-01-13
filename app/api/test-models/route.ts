import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                error: "GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables"
            }, { status: 500 });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.ok) {
            return NextResponse.json({
                error: `API returned ${response.status}: ${response.statusText}`
            }, { status: response.status });
        }

        const data = await response.json();

        // Filter to show only Gemini models
        const geminiModels = data.models?.filter((model: any) =>
            model.name.includes("gemini") ||
            model.displayName?.toLowerCase().includes("gemini")
        ).map((model: any) => ({
            name: model.name,
            displayName: model.displayName,
            supportedMethods: model.supportedGenerationMethods,
            description: model.description
        })) || [];

        return NextResponse.json({
            totalModels: data.models?.length || 0,
            geminiModels,
            suggestedModel: geminiModels.find((m: any) => m.name.includes("flash"))?.name || geminiModels[0]?.name || "No Gemini models found"
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
