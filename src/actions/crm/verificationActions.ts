'use server';

import { emailDependencies } from "@/backend/email/dependencies";
import { conversationDependencies } from "@/backend/conversation/dependencies";
import { EmailTemplates } from "@/backend/email/application/EmailTemplates";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Lead } from "@/backend/lead/domain/Lead";
import { LeadSchema } from "@/lib/schemas/leadSchema";

// Simple in-memory store for MVP
// Storing Name and Phone now
const otpStore = new Map<string, { code: string, expires: number, name: string, phone?: string }>();

export async function sendVerificationEmailAction(data: { name: string, email: string, phone: string }, captchaToken: string) {
    // 1. Verify Captcha (Mocked for now, implies calling Google API)
    if (!captchaToken) {
        return { success: false, error: "Invalid Captcha" };
    }
    console.log(`[VerifyAction] Verifying captcha token: ${captchaToken.slice(0, 10)}...`);

    // 2. Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 1000 * 60 * 10; // 10 mins

    otpStore.set(data.email, { code, expires, name: data.name, phone: data.phone });

    // 3. Send Email
    try {
        const template = EmailTemplates.otp(data.name, code);
        await emailDependencies.sendEmail.execute(
            data.email,
            template.subject,
            { text: template.text, html: template.html }
        );
        console.log(`[VerifyAction] 📧 Email queued for ${data.email}`);
        return { success: true };
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return { success: false, error: "Failed to send email" };
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
            phone: record.phone
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

export async function createVerifiedLeadAction(contact: { email: string; name: string; phone?: string | undefined }) {
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
                source: 'public_chat'
            });
            leadId = newLead.id;

            // Persist using toPersistence if available or manually properties if not exported public
            // Lead class has toPersistence()
            const persistence = newLead.toPersistence();
            await adminDb.collection('leads').doc(leadId).set(persistence);
        }

        return { success: true, leadId };
    } catch (error) {
        console.error("Error creating verify lead:", error);
        return { success: false, error: "Failed to persist lead" };
    }
}
