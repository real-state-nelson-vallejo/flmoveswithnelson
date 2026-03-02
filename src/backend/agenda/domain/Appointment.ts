import { AppointmentPersistenceModel } from "../infrastructure/dto/AppointmentPersistence";
import { randomUUID } from "crypto";

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export enum AppointmentType {
    PROPERTY_VIEWING = 'PROPERTY_VIEWING',
    CALL = 'CALL',
    GENERAL = 'GENERAL'
}

export interface AppointmentProps {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    type: AppointmentType;
    propertyId?: string | undefined;
    leadId?: string | undefined;
    notes?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
}

export class Appointment {
    private constructor(private props: AppointmentProps) { }

    static create(data: {
        title: string;
        startTime: Date;
        endTime: Date;
        type: AppointmentType;
        propertyId?: string | undefined;
        leadId?: string | undefined;
        notes?: string | undefined;
    }): Appointment {
        const now = new Date();
        return new Appointment({
            id: randomUUID(),
            title: data.title,
            startTime: data.startTime,
            endTime: data.endTime,
            status: AppointmentStatus.CONFIRMED, // Default to CONFIRMED for now as per previous logic
            type: data.type,
            propertyId: data.propertyId,
            leadId: data.leadId,
            notes: data.notes,
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: AppointmentPersistenceModel): Appointment {
        return new Appointment({
            id: data.id,
            title: data.title,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            status: data.status as AppointmentStatus,
            type: data.type as AppointmentType,
            propertyId: data.propertyId,
            leadId: data.leadId,
            notes: data.notes,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }

    toPersistence(): AppointmentPersistenceModel {
        return {
            id: this.props.id,
            title: this.props.title,
            startTime: this.props.startTime.getTime(),
            endTime: this.props.endTime.getTime(),
            status: this.props.status,
            type: this.props.type,
            propertyId: this.props.propertyId,
            leadId: this.props.leadId,
            notes: this.props.notes,
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    // Business Methods
    cancel(): void {
        this.props.status = AppointmentStatus.CANCELLED;
        this.touch();
    }

    complete(): void {
        this.props.status = AppointmentStatus.COMPLETED;
        this.touch();
    }

    reschedule(newStart: Date, newEnd: Date): void {
        this.props.startTime = newStart;
        this.props.endTime = newEnd;
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }

    // Getters
    get id() { return this.props.id; }
    get title() { return this.props.title; }
    get startTime() { return this.props.startTime; }
    get endTime() { return this.props.endTime; }
    get status() { return this.props.status; }
    get type() { return this.props.type; }
    get propertyId() { return this.props.propertyId; }
    get leadId() { return this.props.leadId; }
    get notes() { return this.props.notes; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
}
