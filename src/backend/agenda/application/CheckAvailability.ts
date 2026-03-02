import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";

export class CheckAvailability {
    constructor(private repository: AppointmentRepository) { }

    async execute(start: Date, end: Date): Promise<boolean> {
        // A slot is available if there are no overlapping appointments.
        // This is a simplified view (binary available/not available).
        const overlaps = await this.repository.findOverlapping(start, end);

        // Filter out CANCELLED appointments just in case the repo returns them
        const activeOverlaps = overlaps.filter(a => a.status !== 'CANCELLED');

        return activeOverlaps.length === 0;
    }
}
