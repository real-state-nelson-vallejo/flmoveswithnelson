import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { conversationId, userInput } = body;

        console.log(`[API generateAIReply] ConversationID: ${conversationId}`);
        console.log(`[API generateAIReply] Input: ${userInput?.substring(0, 50)}...`);

        if (!conversationId || !userInput) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Import dependencies
        const { conversationDependencies } = await import('@/backend/conversation/dependencies');
        const { Message } = await import('@/backend/conversation/domain/Conversation');

        // Fetch conversation and messages
        const conversation = await conversationDependencies.conversationRepository.findById(conversationId);
        if (!conversation) {
            return NextResponse.json(
                { error: 'Conversation not found' },
                { status: 404 }
            );
        }

        const messages = await conversationDependencies.conversationRepository.findMessagesByConversationId(conversationId);

        console.log(`[API generateAIReply] Found ${messages.length} messages in history`);

        // Build history for AI
        const history = messages.map(msg => ({
            role: msg.senderRole === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Use Google AI SDK directly with proper error handling
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) {
            console.error('[API generateAIReply] No API key configured');
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp'
        });

        console.log(`[API generateAIReply] Starting chat with ${history.length} messages`);

        const chat = model.startChat({
            history: history,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        });

        // Send message with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout after 25s')), 25000)
        );

        const result = await Promise.race([
            chat.sendMessage(userInput),
            timeoutPromise
        ]);

        const aiResponse = result.response.text();
        console.log(`[API generateAIReply] AI generated ${aiResponse.length} chars`);

        // Create and save AI message
        const aiMessage = Message.create(
            conversationId,
            'system-ai',
            'system',
            aiResponse,
            'text',
            {}
        );

        await conversationDependencies.conversationRepository.saveMessage(aiMessage);
        console.log(`[API generateAIReply] Saved message: ${aiMessage.id}`);

        return NextResponse.json({
            success: true,
            message: aiResponse
        });

    } catch (error) {
        console.error('[API generateAIReply] Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to generate AI response',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
