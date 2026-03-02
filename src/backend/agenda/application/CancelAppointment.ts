
import { AppointmentRepository } from "../domain/AppointmentRepository";
import { Appointment } from "../domain/Appointment";

/**
 * CancelAppointment use case.
 *
 * Security: enforces that the requesting lead is the owner of the appointment.
 * Throws an Unauthorized error if the leadId does not match.
 */
export class CancelAppointment {
    constructor(private readonly repository: AppointmentRepository) { }

    async execute(appointmentId: string, requestingLeadId: string): Promise<Appointment> {
        const appointment = await this.repository.findById(appointmentId);

        if (!appointment) {
            throw new Error(`Appointment ${appointmentId} not found.`);
        }

        // ── Ownership check ─────────────────────────────────────────────────────
        // Only the lead who created the appointment may cancel it.
        if (appointment.leadId !== requestingLeadId) {
            console.warn(
                `[CancelAppointment] Unauthorized attempt: lead "${requestingLeadId}" tried to cancel appointment "${appointmentId}" owned by "${appointment.leadId}"`
            );
            throw new Error(
                `Unauthorized: you can only cancel appointments that belong to you.`
            );
        }

        appointment.cancel();
        await this.repository.update(appointment);

        console.log(
            `[CancelAppointment] Appointment ${appointmentId} cancelled by lead ${requestingLeadId}`
        );

        return appointment;
    }
}
