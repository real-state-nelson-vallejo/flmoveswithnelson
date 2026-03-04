import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { GenkitAgentService } from '@/backend/ai/application/GenkitAgentService';
import { voiceSessionManager } from '@/backend/voice/VoiceSessionManager';
import { sendPropertySMS } from '@/backend/voice/SendPropertySMS';
import { SyncVoiceTranscriptionService } from '@/backend/voice/application/SyncVoiceTranscriptionService';
import { FirestoreConversationRepository } from '@/backend/conversation/infrastructure/FirestoreConversationRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const transcriptionService = new SyncVoiceTranscriptionService(new FirestoreConversationRepository());
export const maxDuration = 25; // Vercel timeout

/**
 * POST /api/voice/respond
 * Twilio webhook: Called after <Gather> captures speech.
 * Processes the transcript through the AI agent and responds with TwiML.
 */
export async function GET(request: NextRequest) {
    return handleRespondRequest(request);
}

export async function POST(request: NextRequest) {
    return handleRespondRequest(request);
}

async function handleRespondRequest(request: NextRequest) {
    const twiml = new twilio.twiml.VoiceResponse();

    try {
        let speechResult: string = '';
        let digits: string = '';
        let callSid: string = '';
        let callerPhone: string = '';

        if (request.method === 'POST') {
            const formData = await request.formData();
            speechResult = (formData.get('SpeechResult') as string) || '';
            digits = (formData.get('Digits') as string) || '';
            callSid = (formData.get('CallSid') as string) || '';
            callerPhone = (formData.get('From') as string) || '';
        } else {
            const url = new URL(request.url);
            speechResult = url.searchParams.get('SpeechResult') || '';
            digits = url.searchParams.get('Digits') || '';
            callSid = url.searchParams.get('CallSid') || '';
            callerPhone = url.searchParams.get('From') || '';
        }

        console.log(`[Voice] CallSid: ${callSid} | Speech: "${speechResult}" | Digits: "${digits}"`);

        // Get/create voice session
        const session = voiceSessionManager.getOrCreate(callSid, callerPhone);

        // Handle Language Switch
        if (digits === '1' || (speechResult && speechResult.toLowerCase().includes('español'))) {
            voiceSessionManager.setLanguage(callSid, 'es-US');

            // If it was just a language switch command, acknowledge and listen again
            if (digits === '1' || speechResult.trim().toLowerCase() === 'español') {
                twiml.say({ voice: 'Polly.Lucia', language: 'es-US' }, "Perfecto, hablemos en español. ¿En qué te puedo ayudar?");
                twiml.gather({
                    input: ['speech', 'dtmf'],
                    action: '/api/voice/respond',
                    method: 'POST',
                    speechTimeout: 'auto',
                    language: 'es-US',
                    numDigits: 1
                });
                return xmlResponse(twiml);
            }
        }

        const isSpanish = session.language.startsWith('es');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const voiceName: any = isSpanish ? 'Polly.Lucia' : 'Polly.Joanna';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gatherLanguage: any = session.language;

        if (!speechResult && !digits) {
            twiml.say({ voice: voiceName, language: gatherLanguage }, isSpanish ? "No te he entendido. ¿Podrías repetirlo?" : "I didn't catch that. Could you repeat?");
            twiml.redirect('/api/voice/incoming');
            return xmlResponse(twiml);
        }

        if (!speechResult && digits) {
            // Unhandled digit
            twiml.redirect('/api/voice/incoming');
            return xmlResponse(twiml);
        }

        // Security: cap speech input length to prevent LLM context overflow / prompt injection via long strings
        if (speechResult.length > 1000) {
            console.warn(`[Voice] SpeechResult truncated from ${speechResult.length} chars to 1000 (CallSid: ${callSid})`);
            speechResult = speechResult.substring(0, 1000);
        }

        // Check for goodbye intent
        const goodbyePhrases = ['goodbye', 'bye', 'hang up', 'end call', 'that\'s all', 'thank you bye', 'adiós', 'hasta luego', 'gracias', 'colgar'];
        if (goodbyePhrases.some(phrase => speechResult.toLowerCase().includes(phrase))) {
            twiml.say(
                { voice: voiceName, language: gatherLanguage },
                isSpanish ? '¡Gracias por llamar a FL Moves con Nelson! Que tengas un excelente día. ¡Adiós!' : 'Thank you for calling FL Moves with Nelson! Have a wonderful day. Goodbye!'
            );
            twiml.hangup();
            voiceSessionManager.remove(callSid);
            return xmlResponse(twiml);
        }

        // Add user message to history
        voiceSessionManager.addMessage(callSid, 'user', speechResult);

        // Log to Firestore Transcription 
        if (session.leadId) {
            try {
                const cId = await transcriptionService.execute({
                    leadId: session.leadId,
                    conversationId: session.conversationId,
                    content: speechResult,
                    role: 'user'
                });
                voiceSessionManager.setConversationId(callSid, cId);
            } catch (err) {
                console.error('[Voice] Error logging user transcription:', err);
            }
        }

        // Call the AI Agent
        const agentService = new GenkitAgentService();
        const response = await agentService.generateResponse({
            message: speechResult,
            history: session.history.map(h => ({
                role: h.role,
                content: h.content,
            })),
            context: {
                leadPhone: callerPhone,
                language: session.language,
                leadId: session.leadId,
            },
            channel: 'voice',
        });

        let aiText = response.text;
        const shouldEndCall = aiText.includes('[END_CALL]');

        if (shouldEndCall) {
            aiText = aiText.replace('[END_CALL]', '').trim();
            console.log(`[Voice] AI requested to hang up the call. (CallSid: ${callSid})`);
        }

        // Add AI response to history
        voiceSessionManager.addMessage(callSid, 'model', aiText);

        // Log to Firestore Transcription 
        if (session.leadId) {
            try {
                // By now, conversationId is definitely set from the user's first message
                // but we pass session.conversationId just to be sure we append to the same thread
                const cId = await transcriptionService.execute({
                    leadId: session.leadId,
                    conversationId: session.conversationId,
                    content: aiText,
                    role: 'model'
                });
                voiceSessionManager.setConversationId(callSid, cId);
            } catch (err) {
                console.error('[Voice] Error logging model transcription:', err);
            }
        }

        // --- 1. LANGUAGE SWITCH INTERCEPTION ---
        if (response.toolOutput?._internalAction?.type === 'CHANGE_LANGUAGE') {
            const newLang = response.toolOutput._internalAction.language;
            voiceSessionManager.setLanguage(callSid, newLang);
            console.log(`[Voice] AI triggered language switch to ${newLang} dynamically.`);
            // Update local references so the very next <Say> uses the new language
            session.language = newLang;
        }

        // Re-evaluate voiceName and gatherLanguage after potential AI change
        const finalIsSpanish = session.language.startsWith('es');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalVoiceName: any = finalIsSpanish ? 'Polly.Lucia' : 'Polly.Joanna';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalGatherLanguage: any = session.language;

        // --- 2. SMS SENDING INTERCEPTION ---
        // Check if properties were found -> send SMS
        if (response.toolOutput?.properties && response.toolOutput.properties.length > 0 && callerPhone) {
            sendPropertySMS(callerPhone, response.toolOutput.properties).catch(err =>
                console.error('[Voice] SMS send failed:', err)
            );
        }

        // Speak the AI response
        twiml.say({ voice: finalVoiceName, language: finalGatherLanguage }, aiText);

        if (shouldEndCall) {
            twiml.hangup();
            voiceSessionManager.remove(callSid);
        } else {
            // Continue listening
            twiml.gather({
                input: ['speech', 'dtmf'],
                action: '/api/voice/respond',
                method: 'POST',
                speechTimeout: 'auto',
                language: finalGatherLanguage,
                numDigits: 1
            });

            // If no input after response, prompt
            twiml.say({ voice: finalVoiceName, language: finalGatherLanguage }, finalIsSpanish ? "¿Sigues ahí?" : "Are you still there?");
            twiml.redirect('/api/voice/incoming');
        }

    } catch (error) {
        console.error('[Voice] Error processing speech:', error);
        // Fallback voice is Joanna if session language fails before assignment
        twiml.say(
            { voice: 'Polly.Joanna', language: 'en-US' },
            "I'm sorry, I had trouble processing that. Let me try again."
        );
        twiml.redirect('/api/voice/incoming');
    }

    return xmlResponse(twiml);
}

function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
    return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
    });
}
