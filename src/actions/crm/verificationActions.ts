'use server';

import { emailRepository } from "@/backend/crm/dependencies";
import { EmailTemplates } from "@/backend/crm/application/email/templates";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Lead } from "@/backend/crm/domain/Lead";

// Simple in-memory store for MVP
// Storing Name now too
const otpStore = new Map<string, { code: string, expires: number, name: string }>();

export async function sendVerificationEmailAction(data: { name: string, email: string }, captchaToken: string) {
    // 1. Verify Captcha (Mocked for now, implies calling Google API)
    if (!captchaToken) {
        return { success: false, error: "Invalid Captcha" };
    }
    console.log(`[VerifyAction] Verifying captcha token: ${captchaToken.slice(0, 10)}...`);

    // 2. Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 1000 * 60 * 10; // 10 mins

    otpStore.set(data.email, { code, expires, name: data.name });

    // 3. Send Email
    try {
        const template = EmailTemplates.otp(data.name, code);
        await emailRepository.sendEmail({
            to: [data.email], // Trying as array to ensure broader compatibility
            message: template
        });
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
            name: record.name
        });

        if (!leadRes.success || !leadRes.leadId) throw new Error("Failed to create profile");

        // 2. Mint Token using Lead ID as UID
        const customToken = await adminAuth.createCustomToken(leadRes.leadId, { role: 'lead' });

        otpStore.delete(email);

        return {
            success: true,
            token: customToken,
            leadId: leadRes.leadId
        };

    } catch (error) {
        console.error("Token Mint Error:", error);
        return { success: false, error: "Verification success, but login failed." };
    }
}

// --- Lead Persistence ---

export async function createVerifiedLeadAction(contact: { email: string; name: string; phone?: string }) {
    try {
        // Double check if lead exists by email to avoid duplicates
        const snapshot = await adminDb.collection('leads').where('email', '==', contact.email).limit(1).get();

        let leadId: string;

        if (!snapshot.empty) {
            // Update existing
            leadId = snapshot.docs[0].id;
            await adminDb.collection('leads').doc(leadId).update({
                name: contact.name, // Update name if user provided a new one
                phone: contact.phone || snapshot.docs[0].data().phone,
                updatedAt: Date.now(),
                status: 'new' // Re-open if old
            });
        } else {
            // Create New
            leadId = crypto.randomUUID();
            const newLead: Lead = {
                id: leadId,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                status: 'new',
                source: 'public_chat',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await adminDb.collection('leads').doc(leadId).set(newLead);
        }

        return { success: true, leadId };
    } catch (error) {
        console.error("Error creating verify lead:", error);
        return { success: false, error: "Failed to persist lead" };
    }
}
