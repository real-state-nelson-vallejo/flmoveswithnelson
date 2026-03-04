import { randomUUID } from "crypto";

export enum ScheduleEntityType {
    USER = 'USER',
    PROPERTY = 'PROPERTY'
}

export interface TimeSlot {
    start: string; // 'HH:mm' format (e.g., '09:00')
    end: string;   // 'HH:mm' format (e.g., '17:00')
}

export interface DaySchedule {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    slots: TimeSlot[];
    isActive: boolean;
}

export interface ScheduleProps {
    id: string;
    entityId: string;       // ID of the User or Property
    entityType: ScheduleEntityType;
    timezone: string;       // e.g., 'America/New_York'
    weeklySchedule: DaySchedule[];
    createdAt: Date;
    updatedAt: Date;
}

export class Schedule {
    private constructor(private props: ScheduleProps) { }

    static create(data: {
        entityId: string;
        entityType: ScheduleEntityType;
        timezone?: string;
        weeklySchedule?: DaySchedule[];
    }): Schedule {
        const now = new Date();
        const defaultSchedule = this.generateDefaultWeeklySchedule();

        return new Schedule({
            id: randomUUID(),
            entityId: data.entityId,
            entityType: data.entityType,
            timezone: data.timezone || 'America/New_York', // Default timezone
            weeklySchedule: data.weeklySchedule || defaultSchedule,
            createdAt: now,
            updatedAt: now
        });
    }

    private static generateDefaultWeeklySchedule(): DaySchedule[] {
        // By default: Monday-Friday 9am-5pm, Weekends inactive
        return Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            isActive: i >= 1 && i <= 5, // Mon-Fri active
            slots: i >= 1 && i <= 5 ? [{ start: '09:00', end: '17:00' }] : []
        }));
    }

    // Persistence Reconstitution
    static fromPersistence(data: any): Schedule {
        return new Schedule({
            id: data.id,
            entityId: data.entityId,
            entityType: data.entityType as ScheduleEntityType,
            timezone: data.timezone,
            weeklySchedule: data.weeklySchedule,
            createdAt: typeof data.createdAt === 'string' ? new Date(data.createdAt) : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
            updatedAt: typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)),
        });
    }

    toPersistence(): any {
        return {
            id: this.props.id,
            entityId: this.props.entityId,
            entityType: this.props.entityType,
            timezone: this.props.timezone,
            weeklySchedule: this.props.weeklySchedule,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }

    // Business Logic

    updateTimezone(newTimezone: string): void {
        this.props.timezone = newTimezone;
        this.touch();
    }

    updateWeeklySchedule(newSchedule: DaySchedule[]): void {
        // Validate day boundaries if needed
        this.props.weeklySchedule = newSchedule;
        this.touch();
    }

    // Checks if a specific datetime is available within the schedule
    isAvailable(date: Date): boolean {
        // Complex logic could go here; for now, simple conceptual representation.
        // Needs proper timezone consideration and TimeSlot overlap checking.
        const day = date.getDay();
        const config = this.props.weeklySchedule.find(s => s.dayOfWeek === day);
        if (!config || !config.isActive) return false;

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        return config.slots.some(slot => slot.start <= timeStr && slot.end >= timeStr);
    }

    formatForAI(): string {
        const activeDays = this.props.weeklySchedule.filter(d => d.isActive);
        if (activeDays.length === 0) return 'No availability set.';

        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return activeDays.map(d => {
            const timeStr = d.slots.map(s => `${s.start}-${s.end}`).join(', ');
            return `${daysMap[d.dayOfWeek]}: ${timeStr}`;
        }).join(' | ');
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }

    // Getters
    get id() { return this.props.id; }
    get entityId() { return this.props.entityId; }
    get entityType() { return this.props.entityType; }
    get timezone() { return this.props.timezone; }
    get weeklySchedule() { return this.props.weeklySchedule; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
}
