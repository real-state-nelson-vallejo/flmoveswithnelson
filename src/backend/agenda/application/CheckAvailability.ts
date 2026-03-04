import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";
import { GetScheduleUseCase } from "./GetScheduleUseCase";
import { ScheduleEntityType } from "../domain/Schedule";

export class CheckAvailability {
    constructor(
        private repository: AppointmentRepository,
        private getScheduleUseCase?: GetScheduleUseCase
    ) { }

    async execute(start: Date, end: Date, propertyId?: string): Promise<boolean> {
        if (this.getScheduleUseCase) {
            let schedule;
            if (propertyId) {
                schedule = await this.getScheduleUseCase.execute(propertyId, ScheduleEntityType.PROPERTY);
                const activeDays = schedule.weeklySchedule.some((day: any) => day.isActive);
                if (!activeDays) {
                    schedule = await this.getScheduleUseCase.execute('admin', ScheduleEntityType.USER);
                }
            } else {
                schedule = await this.getScheduleUseCase.execute('admin', ScheduleEntityType.USER);
            }
            // Basic schedule validation
            if (!schedule.isAvailable(start)) {
                return false;
            }
        }
        // A slot is available if there are no overlapping appointments.
        // This is a simplified view (binary available/not available).
        const overlaps = await this.repository.findOverlapping(start, end);

        // Filter out CANCELLED appointments just in case the repo returns them
        const activeOverlaps = overlaps.filter(a => a.status !== 'CANCELLED');

        return activeOverlaps.length === 0;
    }
}
