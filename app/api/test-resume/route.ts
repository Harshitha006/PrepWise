import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('resume') as File;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: "No file provided",
                receivedData: {
                    hasFile: false,
                    formDataKeys: Array.from(formData.keys())
                }
            });
        }

        const fileInfo = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toISOString()
        };

        // Try to read the file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Get first 100 bytes to see content
        const preview = buffer.toString('utf-8', 0, 100).replace(/[^\x20-\x7E]/g, '?');

        return NextResponse.json({
            success: true,
            message: "File received successfully",
            fileInfo,
            preview: preview,
            bufferLength: buffer.length,
            isPDF: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
