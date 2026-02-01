import { EmailRepository } from "../domain/EmailRepository";
import { Email } from "../domain/Email";

export class SendEmailService {
    constructor(private readonly repository: EmailRepository) { }

    async execute(
        to: string | string[],
        subject: string,
        content: { text?: string; html?: string },
        options?: { from?: string; replyTo?: string; cc?: string[]; bcc?: string[] }
    ): Promise<string> {
        const email = Email.create(to, subject, content, options);
        await this.repository.save(email);
        return email.id;
    }
}
