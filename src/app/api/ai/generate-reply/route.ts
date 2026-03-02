import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * @deprecated This route has been replaced by the `generateAIReplyAction` Server Action
 * (src/actions/crm/actions.ts), which uses GenkitAgentService with full tool support,
 * proper lead context, and security guardrails.
 *
 * If you are an internal caller, use `generateAIReplyAction(conversationId)` directly.
 * External callers should not be using this endpoint.
 */
export async function POST(request: NextRequest) {
    console.warn('[DEPRECATED] /api/ai/generate-reply was called. Migrate to generateAIReplyAction.');

    const body = await request.json().catch(() => ({}));
    const { conversationId } = body as { conversationId?: string };

    if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    try {
        // Delegate to the proper service so legacy callers still get a valid response
        const { generateAIReplyAction } = await import('@/actions/crm/actions');
        const result = await generateAIReplyAction(conversationId);

        if (!result.success) {
            return NextResponse.json({ error: 'Failed to generate reply' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Reply generated via GenkitAgentService.' });
    } catch (error) {
        console.error('[DEPRECATED route] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI response', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
