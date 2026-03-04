import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { GetOrCreateVoiceLeadService } from '@/backend/voice/application/GetOrCreateVoiceLeadService';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/FirestoreLeadRepository';
import { FirestoreConversationRepository } from '@/backend/conversation/infrastructure/FirestoreConversationRepository';
import { Conversation, Message } from '@/backend/conversation/domain/Conversation';
import { CommunicationChannel } from '@/types/conversation';
import { GenkitAgentService } from '@/backend/ai/application/GenkitAgentService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25; // Important to leave enough execution time for AI

const leadRepository = new FirestoreLeadRepository();
const leadService = new GetOrCreateVoiceLeadService(leadRepository);
const conversationRepository = new FirestoreConversationRepository();

/**
 * POST /api/messaging/incoming
 * Twilio webhook for both SMS and WhatsApp.
 */
export async function POST(request: Request) {
    console.log('\n[Messaging/Incoming] 💬 ======= NUEVO MENSAJE ENTRANTE =======');

    try {
        const formData = await request.formData();
        const rawFrom = formData.get('From') as string || '';
        const body = formData.get('Body') as string || '';
        const profileName = formData.get('ProfileName') as string || '';
        const city = formData.get('FromCity') as string || '';
        const state = formData.get('FromState') as string || '';

        console.log(`[Messaging/Incoming] De: ${rawFrom} | Mensaje: ${body}`);

        if (!rawFrom) {
            return new NextResponse('Missing From parameter', { status: 400 });
        }

        // 1. Detect Channel and Phone
        const isWhatsApp = rawFrom.startsWith('whatsapp:');
        const channel: CommunicationChannel = isWhatsApp ? 'whatsapp' : 'sms';
        const phone = rawFrom.replace('whatsapp:', '');

        // 2. Get or Create Lead
        const lead = await leadService.execute({
            callerPhone: phone,
            callerName: profileName,
            fromCity: city,
            fromState: state
        });

        // 3. Find active conversation or create new
        const existingConvs = await conversationRepository.findByUserId(lead.id);
        let conversation = existingConvs.find(c => c.status === 'active' && c.channel === channel);

        if (!conversation) {
            const result = Conversation.create([lead.id], body, channel, {
                leadName: lead.name,
                profileName,
                isTwilio: true
            });
            conversation = result.conversation;
            await conversationRepository.save(conversation);
            await conversationRepository.saveMessage(result.message);
        } else {
            // Document already exists, just append user message
            const userMsg = Message.create(conversation.id, lead.id, 'user', body, 'text');
            await conversationRepository.saveMessage(userMsg);
        }

        // 4. Generate AI Agent Reply
        console.log(`[Messaging/Incoming] Generando respuesta de AI para ${lead.name}...`);

        // Fetch recent history up to this point (including the message we just saved)
        const recentMessages = await conversationRepository.findMessagesByConversationId(conversation.id, 20);

        // Exclude the current message to be evaluated from the history, pass it natively as prompt
        const validHistory = recentMessages.slice(0, -1).map(m => ({
            role: (m.senderRole === 'user' ? 'user' : 'model'),
            content: m.content
        }));

        const agentService = new GenkitAgentService();
        const aiResult = await agentService.generateResponse({
            message: body,
            history: validHistory,
            context: {
                leadName: lead.name,
                leadId: lead.id,
                leadPhone: lead.phone,
                leadEmail: lead.email,
                notes: lead.toDTO().notes
            },
            channel: channel
        });

        const aiText = aiResult.text;

        // 5. Save AI Reply to Conversation
        const aiMsg = Message.create(
            conversation.id,
            'nelson-bot',
            'agent',
            aiText,
            'text',
            { toolOutput: aiResult.toolOutput }
        );
        await conversationRepository.saveMessage(aiMsg);

        // 6. Return standard TwiML so Twilio sends it to user
        console.log(`[Messaging/Incoming] Respuesta lista, enviando a Twilio...`);
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(aiText);

        return new NextResponse(twiml.toString(), {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('[Messaging/Incoming] Error procesando mensaje:', error);

        // Safe fallback so Twilio doesn't retry forever
        const twiml = new twilio.twiml.MessagingResponse();
        return new NextResponse(twiml.toString(), { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }
}
