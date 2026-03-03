import crypto from 'crypto';

export interface TransactionPresetProps {
    id: string;
    userId: string;
    name: string; // e.g., "Standard No-Pet Lease", "My Listing Agreement"
    description?: string;
    defaultData: Record<string, unknown>; // Key-Value pairs to pre-fill
    createdAt: Date;
    updatedAt: Date;
}

export class TransactionPreset {
    private constructor(private readonly props: TransactionPresetProps) { }

    static create(userId: string, name: string, defaultData: Record<string, unknown>, description?: string): TransactionPreset {
        return new TransactionPreset({
            id: crypto.randomUUID(),
            userId,
            name,
            ...(description ? { description } : {}),
            defaultData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    static fromPersistence(props: TransactionPresetProps): TransactionPreset {
        return new TransactionPreset({
            ...props,
            createdAt: new Date(props.createdAt),
            updatedAt: new Date(props.updatedAt)
        });
    }

    toPersistence(): Record<string, unknown> {
        return {
            ...this.props,
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    update(name: string, defaultData: Record<string, unknown>, description?: string) {
        this.props.name = name;
        this.props.defaultData = defaultData;
        if (description !== undefined) this.props.description = description;
        this.touch();
    }

    private touch() {
        this.props.updatedAt = new Date();
    }

    get id() { return this.props.id; }
    get userId() { return this.props.userId; }
    get name() { return this.props.name; }
    get description() { return this.props.description; }
    get defaultData() { return { ...this.props.defaultData }; }
}
