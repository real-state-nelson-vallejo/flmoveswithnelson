export interface LegalProfileProps {
    userId: string;
    broker: {
        name: string;
        licenseNumber: string;
        address: string;
        phone: string;
        email: string;
        companyName: string;
    };
    // Additional fields can be added here (e.g. standard landlord info)
    updatedAt: Date;
}

export class LegalProfile {
    private constructor(private readonly props: LegalProfileProps) { }

    static create(userId: string, broker: LegalProfileProps['broker']): LegalProfile {
        return new LegalProfile({
            userId,
            broker,
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: LegalProfileProps): LegalProfile {
        return new LegalProfile({
            ...props,
            updatedAt: new Date(props.updatedAt)
        });
    }

    toPersistence(): Record<string, unknown> {
        return {
            ...this.props,
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    get userId() { return this.props.userId; }
    get broker() { return { ...this.props.broker }; }

    updateBroker(broker: Partial<LegalProfileProps['broker']>) {
        this.props.broker = { ...this.props.broker, ...broker };
        this.touch();
    }

    private touch() {
        this.props.updatedAt = new Date();
    }
}
