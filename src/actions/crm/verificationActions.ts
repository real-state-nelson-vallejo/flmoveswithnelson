'use server';

import { emailDependencies } from "@/backend/email/dependencies";
import { conversationDependencies } from "@/backend/conversation/dependencies";
import { EmailTemplates } from "@/backend/email/application/EmailTemplates";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Lead } from "@/backend/lead/domain/Lead";
import { LeadSchema } from "@/lib/schemas/leadSchema";
import twilio from 'twilio';

// Simple in-memory store for MVP
// Storing Name and Phone now
const otpStore = new Map<string, { code: string, expires: number, name: string, phone?: string | undefined, intent?: string | undefined }>();

export async function sendVerificationCodeAction(data: { name: string, email: string, phone: string, intent?: string | undefined, channel?: 'email' | 'sms' }, captchaToken: string) {
    // 1. Verify Captcha (Mocked for now, implies calling Google API)
    if (!captchaToken) {
        return { success: false, error: "Invalid Captcha" };
    }
    console.log(`[VerifyAction] Verifying captcha token: ${captchaToken.slice(0, 10)}...`);

    // 2. Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 1000 * 60 * 10; // 10 mins

    otpStore.set(data.email, { code, expires, name: data.name, phone: data.phone, intent: data.intent });

    // 3. Send Code
    try {
        if (data.channel === 'sms') {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: `Your FL Moves verification code is: ${code}`,
                from: process.env.TWILIO_PHONE_NUMBER as string,
                to: data.phone
            });
            console.log(`[VerifyAction] 📱 SMS queued for ${data.phone}`);
            return { success: true };
        } else {
            const template = EmailTemplates.otp(data.name, code);
            await emailDependencies.sendEmail.execute(
                data.email,
                template.subject,
                { text: template.text, html: template.html }
            );
            console.log(`[VerifyAction] 📧 Email queued for ${data.email}`);
            return { success: true };
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        return { success: false, error: "Failed to send verification code" };
    }
}

export async function verifyOtpAction(email: string, code: string) {
    const record = otpStore.get(email);

    if (!record) return { success: false, error: "Code expired or not found" };
    if (Date.now() > record.expires) {
        otpStore.delete(email);
        return { success: false, error: "Code expired" };
    }
    if (record.code !== code) return { success: false, error: "Invalid code" };

    // Success - Create Custom Token for Client Auth
    try {
        // 1. Ensure Lead Exists (Create/Update)
        const leadRes = await createVerifiedLeadAction({
            email,
            name: record.name,
            phone: record.phone,
            intent: record.intent
        });

        if (!leadRes.success || !leadRes.leadId) throw new Error("Failed to create profile");

        // 2. Mint Token using Lead ID as UID
        const customToken = await adminAuth.createCustomToken(leadRes.leadId, { role: 'lead' });

        // 3. Find Existing Active Conversation (Persistence Check)
        // We look for conversations where this lead is a participant
        const conversations = await conversationDependencies.conversationRepository.findByUserId(leadRes.leadId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeConversation = conversations.find((c: any) => c.status === 'active');

        otpStore.delete(email);

        return {
            success: true,
            token: customToken,
            leadId: leadRes.leadId,
            existingConversationId: activeConversation?.id
        };

    } catch (error) {
        console.error("Token Mint Error:", error);
        return { success: false, error: "Verification success, but login failed." };
    }
}

// --- Lead Persistence ---

export async function createVerifiedLeadAction(contact: { email: string; name: string; phone?: string | undefined; intent?: string | undefined; }) {
    try {
        // Double check if lead exists by email to avoid duplicates
        const snapshot = await adminDb.collection('leads').where('email', '==', contact.email).limit(1).get();

        let leadId: string;

        if (!snapshot.empty) {
            // Update existing
            leadId = snapshot.docs[0]!.id;
            const existingData = snapshot.docs[0]!.data();

            // Validate strict type with schema to avoid implicit any on unchecked property access
            const parsed = LeadSchema.safeParse(existingData);
            const existingPhone = parsed.success ? parsed.data.phone : undefined;

            await adminDb.collection('leads').doc(leadId).update({
                name: contact.name, // Update name if user provided a new one
                phone: contact.phone || existingPhone,
                updatedAt: Date.now(),
                status: 'new' // Re-open if old
            });
        } else {
            // Create New using Factory
            const newLead = Lead.create({
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                source: 'public_chat',
                intent: contact.intent
            });
            leadId = newLead.id;

            // Persist using toPersistence if available or manually properties if not exported public
            // Lead class has toPersistence()
            const persistence = newLead.toPersistence();
            await adminDb.collection('leads').doc(leadId).set(persistence);

            // Notify Admin synchronously or asynchronously
            try {
                // Determine admin address, falling back to a default testing address
                const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "vallejonelson1722@gmail.com";
                const secondaryEmail = "caangogi@gmail.com";

                const adminTemplate = EmailTemplates.newLeadAdminAlert({
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    source: 'Public Web AI Chat',
                    intent: contact.intent
                });

                const welcomeTemplate = EmailTemplates.welcomeLead(contact.name);

                // IMPORTANT: Await the promises so Server Action does not terminate before Firebase writes
                await Promise.allSettled([
                    emailDependencies.sendEmail.execute(
                        adminEmail,
                        adminTemplate.subject,
                        { text: adminTemplate.text, html: adminTemplate.html }
                    ),
                    emailDependencies.sendEmail.execute(
                        secondaryEmail,
                        adminTemplate.subject,
                        { text: adminTemplate.text, html: adminTemplate.html }
                    ),
                    emailDependencies.sendEmail.execute(
                        contact.email,
                        welcomeTemplate.subject,
                        { text: welcomeTemplate.text, html: welcomeTemplate.html }
                    )
                ]);

                console.log(`[VerifyAction] New lead admin & welcome alerts processed without erroring main flow`);
            } catch (notifyErr) {
                console.error("[VerifyAction] Email sending trigger failed:", notifyErr);
            }
        }

        return { success: true, leadId };
    } catch (error) {
        console.error("Error creating verify lead:", error);
        return { success: false, error: "Failed to persist lead" };
    }
}

export async function submitContactFormAction(data: { name: string; email: string; phone?: string | undefined; intent?: string | undefined; }) {
    try {
        const newLead = Lead.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: 'website_contact_form',
            intent: data.intent
        });

        const leadId = newLead.id;
        const persistence = newLead.toPersistence();
        await adminDb.collection('leads').doc(leadId).set(persistence);

        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "vallejonelson1722@gmail.com";
        const secondaryEmail = "caangogi@gmail.com";

        const adminTemplate = EmailTemplates.newLeadAdminAlert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: 'Website Landing Form',
            intent: data.intent
        });

        const welcomeTemplate = EmailTemplates.welcomeLead(data.name);

        await Promise.allSettled([
            emailDependencies.sendEmail.execute(
                adminEmail,
                adminTemplate.subject,
                { text: adminTemplate.text, html: adminTemplate.html }
            ),
            emailDependencies.sendEmail.execute(
                secondaryEmail,
                adminTemplate.subject,
                { text: adminTemplate.text, html: adminTemplate.html }
            ),
            emailDependencies.sendEmail.execute(
                data.email,
                welcomeTemplate.subject,
                { text: welcomeTemplate.text, html: welcomeTemplate.html }
            )
        ]);

        return { success: true, leadId };
    } catch (err: any) {
        console.error("submitContactFormAction error:", err);
        return { success: false, error: err.message };
    }
}
