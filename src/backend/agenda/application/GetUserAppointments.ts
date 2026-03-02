
import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";
import { Appointment } from "@/backend/agenda/domain/Appointment";

export class GetUserAppointments {
    constructor(private readonly repository: AppointmentRepository) { }

    async execute(leadId: string): Promise<Appointment[]> {
        const appointments = await this.repository.findByUserId(leadId);
        // Filter out past appointments? Or the agent can filter.
        // Let's return all future and recent past (e.g. last 24h)?
        // For simplicity, let's return all valid (CONFIRMED/PENDING) future appointments.

        const now = new Date();
        return appointments.filter(a =>
            a.startTime > now &&
            (a.status === 'CONFIRMED' || a.status === 'PENDING')
        );
    }
}
