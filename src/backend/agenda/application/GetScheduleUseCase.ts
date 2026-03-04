import { Schedule, ScheduleEntityType } from "../domain/Schedule";
import { FirestoreScheduleRepository } from "../infrastructure/FirestoreScheduleRepository";

export class GetScheduleUseCase {
    constructor(private repository: FirestoreScheduleRepository) { }

    async execute(entityId: string, entityType: ScheduleEntityType): Promise<Schedule> {
        let schedule = await this.repository.getByEntity(entityId, entityType);

        // If it doesn't exist, we create a default one for this entity on the fly
        if (!schedule) {
            schedule = Schedule.create({
                entityId,
                entityType
            });
            await this.repository.save(schedule);
        }

        return schedule;
    }
}
