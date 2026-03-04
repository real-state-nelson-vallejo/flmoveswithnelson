import { z } from 'zod';
import { ScheduleEntityType } from '../../domain/Schedule';

export const TimeSlotSchema = z.object({
    start: z.string().describe("Time in HH:mm format, e.g., '09:00'"),
    end: z.string().describe("Time in HH:mm format, e.g., '17:00'")
});

export const DayScheduleSchema = z.object({
    dayOfWeek: z.number().min(0).max(6).describe("0 = Sunday, 1 = Monday, 6 = Saturday"),
    isActive: z.boolean(),
    slots: z.array(TimeSlotSchema)
});

export const SchedulePersistenceSchema = z.object({
    id: z.string(),
    entityId: z.string().describe("ID of User or Property"),
    entityType: z.nativeEnum(ScheduleEntityType),
    timezone: z.string(),
    weeklySchedule: z.array(DayScheduleSchema),
    createdAt: z.string().or(z.date()).or(z.any()), // handles firestore Timestamp or ISO string
    updatedAt: z.string().or(z.date()).or(z.any()),
});

export type SchedulePersistenceModel = z.infer<typeof SchedulePersistenceSchema>;
