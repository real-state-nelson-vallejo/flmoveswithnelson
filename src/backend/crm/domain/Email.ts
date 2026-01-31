export interface EmailAddress {
    address: string;
    name?: string;
}

export interface Email {
    to: string | string[];
    message: {
        subject: string;
        text?: string;
        html?: string;
    };
    // Fields specific to Trigger Email Extension
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    headers?: Record<string, string>;
    createdAt?: number;
}
