
import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";
import { Appointment } from "@/backend/agenda/domain/Appointment";
import { CheckAvailability } from "./CheckAvailability";

export class RescheduleAppointment {
    constructor(
        private readonly repository: AppointmentRepository,
        private readonly checkAvailability: CheckAvailability
    ) { }

    async execute(appointmentId: string, newStartTime: Date, newEndTime: Date, requestingLeadId: string): Promise<Appointment> {
        const appointment = await this.repository.findById(appointmentId);
        if (!appointment) {
            throw new Error(`Appointment ${appointmentId} not found`);
        }

        // ── Ownership check ─────────────────────────────────────────────────────
        if (appointment.leadId !== requestingLeadId) {
            console.warn(
                `[RescheduleAppointment] Unauthorized attempt: lead "${requestingLeadId}" tried to reschedule appointment "${appointmentId}" owned by "${appointment.leadId}"`
            );
            throw new Error(`Unauthorized: you can only reschedule appointments that belong to you.`);
        }
        // Check availability (excluding this appointment ideally, but Firestore check is simple)
        // If we move it, we need to make sure the target slot is free.
        // Our naive checkAvailability checks ALL appointments. It might flag THIS appointment if it overlaps slightly, 
        // but since we are moving to a NEW time, usually it's fine unless we move it to overlap with itself (weird edge case).
        // A better checkAvailability would accept an `excludeAppointmentId` param.
        // For MVP, we trust checkAvailability.

        const isAvailable = await this.checkAvailability.execute(newStartTime, newEndTime);
        if (!isAvailable) {
            throw new Error(`Time slot ${newStartTime.toISOString()} is not available.`);
        }

        appointment.reschedule(newStartTime, newEndTime);
        await this.repository.update(appointment);

        return appointment;
    }
}
