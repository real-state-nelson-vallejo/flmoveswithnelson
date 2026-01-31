import { Email } from "../domain/Email";
import { EmailRepository } from "../domain/EmailRepository";
import { adminDb } from "@/lib/firebase/admin";

export class FirestoreEmailRepository implements EmailRepository {
    private collectionName = 'mail'; // Default collection for Trigger Email Extension

    async sendEmail(email: Email): Promise<void> {
        try {
            await adminDb.collection(this.collectionName).add({
                to: email.to,
                message: email.message,
                createdAt: Date.now(),
                ...(email.from && { from: email.from }),
                ...(email.replyTo && { replyTo: email.replyTo }),
            });
            console.log(`[FirestoreEmailRepository] Email queued in '${this.collectionName}' for: ${email.to}`);
        } catch (error) {
            console.error("[FirestoreEmailRepository] Error sending email:", error);
            throw new Error("Failed to queue email");
        }
    }
}
