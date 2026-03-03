import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return new NextResponse(`Failed to fetch from remote: ${response.statusText}`, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (e) {
        console.error("Proxy error:", e);
        return new NextResponse(e instanceof Error ? e.message : "Unknown Error", { status: 500 });
    }
}
