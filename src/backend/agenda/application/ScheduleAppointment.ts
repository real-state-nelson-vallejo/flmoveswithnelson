import { Appointment, AppointmentType } from "@/backend/agenda/domain/Appointment";
import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";


export class ScheduleAppointment {
    constructor(private repository: AppointmentRepository) { }

    async execute(input: {
        title: string;
        startTime: Date;
        endTime: Date;
        type: AppointmentType;
        propertyId?: string;
        leadId?: string;
        notes?: string;
    }): Promise<Appointment> {
        // Basic validation
        if (input.startTime >= input.endTime) {
            throw new Error("Start time must be before end time");
        }

        // Check for overlaps (Business Rule: No double bookings for Property Viewings)
        // Note: In a real system we might allow overlapping calls, but let's be strict for now or make it configurable.
        // For now, let's just warn or allow. Strict check:
        // const overlaps = await this.repository.findOverlapping(input.startTime, input.endTime);
        // if (overlaps.length > 0) { throw new Error("Time slot is not available"); }

        const appointment = Appointment.create({
            title: input.title,
            startTime: input.startTime,
            endTime: input.endTime,
            type: input.type,
            propertyId: input.propertyId,
            leadId: input.leadId,
            notes: input.notes
        });

        await this.repository.save(appointment);
        return appointment;
    }
}
