export interface EmailDTO {
    id: string;
    to: string | string[];
    message: {
        subject: string;
        text?: string | undefined;
        html?: string | undefined;
    };
    from?: string | undefined;
    replyTo?: string | undefined;
    cc?: string[] | undefined;
    bcc?: string[] | undefined;
    headers?: Record<string, string> | undefined;
    createdAt: number;
    status: 'pending' | 'sent' | 'failed';
    error?: string | undefined;
}
