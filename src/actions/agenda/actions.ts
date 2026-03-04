'use server';

import { ScheduleAppointment } from "../../backend/agenda/application/ScheduleAppointment";
import { CheckAvailability } from "../../backend/agenda/application/CheckAvailability";
import { FirestoreAppointmentRepository } from "../../backend/agenda/infrastructure/FirestoreAppointmentRepository";
import { AppointmentType } from "../../backend/agenda/domain/Appointment";
import { ScheduleEntityType, DaySchedule } from "../../backend/agenda/domain/Schedule";
import { GetScheduleUseCase } from "../../backend/agenda/application/GetScheduleUseCase";
import { UpdateScheduleUseCase } from "../../backend/agenda/application/UpdateScheduleUseCase";
import { FirestoreScheduleRepository } from "../../backend/agenda/infrastructure/FirestoreScheduleRepository";
import { revalidatePath } from "next/cache";

// Dependencies
const repository = new FirestoreAppointmentRepository();
const scheduleUseCase = new ScheduleAppointment(repository);
const checkAvailabilityUseCase = new CheckAvailability(repository);

const scheduleRepo = new FirestoreScheduleRepository();
const getScheduleUseCase = new GetScheduleUseCase(scheduleRepo);
const updateScheduleUseCase = new UpdateScheduleUseCase(scheduleRepo, getScheduleUseCase);

export interface AppointmentDTO {
    id: string;
    title: string;
    start: string;
    end: string;
    status: string;
    type: string;
    notes?: string | undefined;
}

export async function getUpcomingAppointments(): Promise<AppointmentDTO[]> {
    // For now, fetch all or a range. Since `findByRange` isn't fully implemented in Repo interface yet (I recall adding it to plan but maybe not code?),
    // let's fetch specific range or just rely on what we have. 
    // Wait, I implemented findOverlapping. 
    // Let's implement a simple "getAll" or "getByRange" in repository if missing?
    // Checking Repo Interface from Step 33... `findOverlapping` exists.
    // I will assume for MVP we fetch a 30-day window using `findOverlapping`.

    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const appointments = await repository.findOverlapping(now, next30Days);

    // Sort by date just in case
    return appointments.map(app => ({
        id: app.id,
        title: app.title,
        start: app.startTime.toISOString(),
        end: app.endTime.toISOString(),
        status: app.status as string,
        type: app.type as string,
        notes: app.notes
    })).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export async function scheduleAppointmentAction(data: {
    title: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    type: AppointmentType;
    notes?: string;
}) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    const available = await checkAvailabilityUseCase.execute(start, end);
    if (!available) {
        throw new Error("Time slot is not available");
    }

    await scheduleUseCase.execute({
        title: data.title,
        startTime: start,
        endTime: end,
        type: data.type as unknown as AppointmentType,
        ...(data.notes ? { notes: data.notes } : {})
    });

    revalidatePath('/dashboard/calendar');
}

// --- Schedule (Availability) Actions ---

export interface ScheduleDTO {
    id: string;
    entityId: string;
    entityType: ScheduleEntityType;
    timezone: string;
    weeklySchedule: DaySchedule[];
}

export async function getScheduleAction(entityId: string, entityType: ScheduleEntityType = ScheduleEntityType.USER): Promise<ScheduleDTO> {
    const schedule = await getScheduleUseCase.execute(entityId, entityType);

    return {
        id: schedule.id,
        entityId: schedule.entityId,
        entityType: schedule.entityType,
        timezone: schedule.timezone,
        weeklySchedule: schedule.weeklySchedule
    };
}

export async function updateScheduleAction(
    entityId: string,
    entityType: ScheduleEntityType,
    data: { timezone?: string, weeklySchedule?: DaySchedule[] }
) {
    await updateScheduleUseCase.execute(entityId, entityType, data);
    revalidatePath('/dashboard/calendar');
}
