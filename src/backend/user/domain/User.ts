
export type UserRole = 'admin' | 'agent' | 'user';

export interface UserProps {
    id: string; // Auth UID
    email: string;
    displayName: string;
    role: UserRole;
    phoneNumber?: string | undefined;
    photoURL?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
}

export class User {
    constructor(private readonly props: UserProps) { }

    get id(): string { return this.props.id; }
    get email(): string { return this.props.email; }
    get displayName(): string { return this.props.displayName; }
    get role(): UserRole { return this.props.role; }
    get phoneNumber(): string | undefined { return this.props.phoneNumber; }
    get photoURL(): string | undefined { return this.props.photoURL; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    isAdmin(): boolean {
        return this.props.role === 'admin' || this.props.role === 'agent'; // Agents might have admin-like privileges
    }

    toDTO() {
        return {
            id: this.id,
            email: this.email,
            displayName: this.displayName,
            role: this.role,
            phoneNumber: this.phoneNumber,
            photoURL: this.photoURL,
            createdAt: this.createdAt.getTime(),
            updatedAt: this.updatedAt.getTime()
        };
    }

    static create(props: UserProps): User {
        return new User(props);
    }
}
