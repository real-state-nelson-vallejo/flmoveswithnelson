import { Email } from "../domain/Email";
import { EmailRepository } from "../domain/EmailRepository";
import { adminDb } from "@/lib/firebase/admin";
import { EmailPersistenceSchema } from "./dto/EmailPersistenceSchema";
import { EmailDTO } from "./dto/EmailDTO";

export class FirestoreEmailRepository implements EmailRepository {
    private collection = adminDb.collection('mail');

    private mapToDomain(data: EmailDTO): Email {
        return new Email({
            ...data,
            to: Array.isArray(data.to) ? data.to : [data.to],
            subject: data.message.subject,
            text: data.message.text,
            html: data.message.html,
            cc: data.cc,
            bcc: data.bcc,
            createdAt: new Date(data.createdAt),
            error: data.error
        });
    }

    private mapToPersistence(email: Email): EmailDTO {
        return email.toDTO();
    }

    async save(email: Email): Promise<void> {
        const data = this.mapToPersistence(email);
        const validated = EmailPersistenceSchema.parse(data);
        await this.collection.doc(email.id).set(validated);
    }

    async findById(id: string): Promise<Email | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;

        const result = EmailPersistenceSchema.safeParse(doc.data());
        if (!result.success) {
            console.error(`Invalid Email data for ID ${id}`, result.error);
            return null;
        }
        return this.mapToDomain(result.data);
    }

    async findByStatus(status: 'pending' | 'sent' | 'failed'): Promise<Email[]> {
        const snapshot = await this.collection.where('status', '==', status).get();
        return snapshot.docs
            .map(doc => {
                const result = EmailPersistenceSchema.safeParse(doc.data());
                return result.success ? this.mapToDomain(result.data) : null;
            })
            .filter((e): e is Email => e !== null);
    }
}
