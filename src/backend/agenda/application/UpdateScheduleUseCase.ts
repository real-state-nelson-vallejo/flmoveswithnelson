import { DaySchedule, ScheduleEntityType } from "../domain/Schedule";
import { FirestoreScheduleRepository } from "../infrastructure/FirestoreScheduleRepository";
import { GetScheduleUseCase } from "./GetScheduleUseCase";

export class UpdateScheduleUseCase {
    constructor(
        private repository: FirestoreScheduleRepository,
        private getScheduleUseCase: GetScheduleUseCase
    ) { }

    async execute(
        entityId: string,
        entityType: ScheduleEntityType,
        data: { timezone?: string, weeklySchedule?: DaySchedule[] }
    ): Promise<void> {

        const schedule = await this.getScheduleUseCase.execute(entityId, entityType);

        if (data.timezone) {
            schedule.updateTimezone(data.timezone);
        }

        if (data.weeklySchedule) {
            schedule.updateWeeklySchedule(data.weeklySchedule);
        }

        await this.repository.save(schedule);
    }
}
