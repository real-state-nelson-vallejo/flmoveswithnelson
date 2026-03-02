import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { GetOrCreateVoiceLeadService } from '@/backend/voice/application/GetOrCreateVoiceLeadService';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/FirestoreLeadRepository';
import { voiceSessionManager } from '@/backend/voice/VoiceSessionManager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const leadRepository = new FirestoreLeadRepository();
const voiceLeadService = new GetOrCreateVoiceLeadService(leadRepository);

/**
 * POST /api/voice/incoming
 * Twilio webhook: Called when someone dials the Twilio number.
 * Returns TwiML with a greeting and <Gather> to capture speech.
 */
export async function GET(request: Request) {
    return handleIncomingRequest(request);
}

export async function POST(request: Request) {
    return handleIncomingRequest(request);
}

async function handleIncomingRequest(request: Request) {
    console.log('\n[Voice/Incoming] 📞 ======= NUEVA LLAMADA ENTRANTE =======');
    console.log(`[Voice/Incoming] URL de la petición: ${request.url} - Método: ${request.method}`);

    let from = '', callSid = '', fromCity = '', fromState = '', fromCountry = '', fromZip = '', callerName = '';

    // Attempt to read params for debugging and lead capture
    try {
        if (request.method === 'POST') {
            const formData = await request.formData();
            from = (formData.get('From') as string) || '';
            callSid = (formData.get('CallSid') as string) || '';
            fromCity = (formData.get('FromCity') as string) || '';
            fromState = (formData.get('FromState') as string) || '';
            fromCountry = (formData.get('FromCountry') as string) || '';
            fromZip = (formData.get('FromZip') as string) || '';
            callerName = (formData.get('CallerName') as string) || '';
        } else {
            const url = new URL(request.url);
            from = url.searchParams.get('From') || '';
            callSid = url.searchParams.get('CallSid') || '';
            fromCity = url.searchParams.get('FromCity') || '';
            fromState = url.searchParams.get('FromState') || '';
            fromCountry = url.searchParams.get('FromCountry') || '';
            fromZip = url.searchParams.get('FromZip') || '';
            callerName = url.searchParams.get('CallerName') || '';
        }
        console.log(`[Voice/Incoming] Número origen: ${from} (${fromCity}, ${fromState})`);
        console.log(`[Voice/Incoming] CallSid: ${callSid}`);

        if (from && callSid) {
            // 1. Process Lead Data via our new Service
            const lead = await voiceLeadService.execute({
                callerPhone: from,
                fromCity,
                fromState,
                fromCountry,
                fromZip,
                callerName
            });
            console.log(`[Voice/Incoming] Lead capturado/actualizado: ${lead.id} (${lead.name})`);

            // 2. Tie Lead to Phone Session
            voiceSessionManager.getOrCreate(callSid, from, lead.id);
        }

    } catch (e) {
        console.log('[Voice/Incoming] No se pudieron leer/procesar los parámetros', e);
    }

    const twiml = new twilio.twiml.VoiceResponse();

    console.log('[Voice/Incoming] Generando respuesta TwiML inicial (bilingüe)...');

    // Listen for speech OR DTMF input (1 for Spanish)
    const gather = twiml.gather({
        input: ['speech', 'dtmf'],
        action: '/api/voice/respond',
        method: 'POST',
        speechTimeout: 'auto',
        language: 'en-US',
        numDigits: 1, // Only wait for 1 digit if they press the keypad
    });

    // Greeting in English
    gather.say(
        {
            voice: 'Polly.Matthew',
            language: 'en-US',
        },
        'Welcome to FL Moves with Nelson, your Florida real estate expert. How can I help you today?'
    );

    // Instruction in Spanish
    gather.say(
        {
            voice: 'Polly.Lucia',
            language: 'es-US',
        },
        'Para continuar en español, presione 1.'
    );

    // If no input, prompt again
    twiml.say(
        { voice: 'Polly.Matthew' },
        "I didn't catch that. Please try again, or press 1 for Spanish."
    );
    twiml.redirect('/api/voice/incoming');

    console.log('[Voice/Incoming] TwiML generado, devolviendo a Twilio.');

    return new NextResponse(twiml.toString(), {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
            // Disable caching so Twilio always gets fresh TwiML
            'Cache-Control': 'no-store, max-age=0'
        },
    });
}
