import { Email } from "./Email";

export interface EmailRepository {
    save(email: Email): Promise<void>;
    findById(id: string): Promise<Email | null>;
    findByStatus(status: 'pending' | 'sent' | 'failed'): Promise<Email[]>;
}
