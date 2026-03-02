import 'server-only';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

/**
 * Sends an SMS with property links to the caller during a voice call.
 */
export async function sendPropertySMS(
    toPhone: string,
    properties: Array<{ title: string; price: number; location: string; link: string }>
): Promise<boolean> {
    if (!accountSid || !authToken || !twilioPhone) {
        console.error('[SendPropertySMS] Missing Twilio credentials');
        return false;
    }

    try {
        const client = twilio(accountSid, authToken);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flmoveswithnelson.com';

        // Build SMS body
        const propertyLines = properties.slice(0, 3).map((p, i) =>
            `${i + 1}. ${p.title} - $${p.price.toLocaleString()}\n   ${p.location}\n   ${baseUrl}${p.link}`
        );

        const body = `🏠 FL Moves with Nelson\n\nHere are the properties we discussed:\n\n${propertyLines.join('\n\n')}\n\nReply to this text or call us back anytime!`;

        await client.messages.create({
            body,
            from: twilioPhone,
            to: toPhone,
        });

        console.log(`[SendPropertySMS] Sent ${properties.length} properties to ${toPhone}`);
        return true;
    } catch (error) {
        console.error('[SendPropertySMS] Failed to send:', error);
        return false;
    }
}
