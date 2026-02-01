import { EmailDTO } from "@/backend/email/infrastructure/dto/EmailDTO";

// --- DOMAIN ---
export interface EmailProps {
    id: string;
    to: string[];
    subject: string;
    text?: string | undefined;
    html?: string | undefined;
    from?: string | undefined;
    replyTo?: string | undefined;
    cc?: string[] | undefined;
    bcc?: string[] | undefined;
    headers?: Record<string, string> | undefined;
    createdAt: Date;
    status: 'pending' | 'sent' | 'failed';
    error?: string | undefined;
}

export class Email {
    constructor(private readonly props: EmailProps) { }

    get id(): string { return this.props.id; }
    get to(): string[] { return [...this.props.to]; }
    get subject(): string { return this.props.subject; }
    get text(): string | undefined { return this.props.text; }
    get html(): string | undefined { return this.props.html; }
    get from(): string | undefined { return this.props.from; }
    get replyTo(): string | undefined { return this.props.replyTo; }
    get cc(): string[] | undefined { return this.props.cc ? [...this.props.cc] : undefined; }
    get bcc(): string[] | undefined { return this.props.bcc ? [...this.props.bcc] : undefined; }
    get headers(): Record<string, string> | undefined { return this.props.headers; }
    get createdAt(): Date { return this.props.createdAt; }
    get status(): 'pending' | 'sent' | 'failed' { return this.props.status; }
    get error(): string | undefined { return this.props.error; }

    markAsSent(): void {
        this.props.status = 'sent';
    }

    markAsFailed(error: string): void {
        this.props.status = 'failed';
        this.props.error = error;
    }

    toDTO(): EmailDTO {
        return {
            id: this.id,
            to: this.to,
            message: {
                subject: this.subject,
                text: this.text,
                html: this.html
            },
            from: this.from,
            replyTo: this.replyTo,
            cc: this.cc,
            bcc: this.bcc,
            headers: this.headers,
            createdAt: this.createdAt.getTime(),
            status: this.status,
            error: this.error
        };
    }

    static create(
        to: string | string[],
        subject: string,
        content: { text?: string; html?: string; },
        options?: { from?: string; replyTo?: string; cc?: string[]; bcc?: string[]; headers?: Record<string, string>; }
    ): Email {
        return new Email({
            id: crypto.randomUUID(),
            to: Array.isArray(to) ? to : [to],
            subject,
            text: content.text,
            html: content.html,
            from: options?.from,
            replyTo: options?.replyTo,
            cc: options?.cc,
            bcc: options?.bcc,
            headers: options?.headers,
            createdAt: new Date(),
            status: 'pending'
        });
    }
}
