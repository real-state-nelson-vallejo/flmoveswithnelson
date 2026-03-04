
import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";
import { addDays, setHours, setMinutes, isBefore } from "date-fns";
import { GetScheduleUseCase } from "./GetScheduleUseCase";
import { ScheduleEntityType } from "../domain/Schedule";

export class GetAvailableSlots {
    constructor(
        private readonly repository: AppointmentRepository,
        private readonly getScheduleUseCase?: GetScheduleUseCase
    ) { }

    async execute(startDate: Date = new Date(), daysToCheck: number = 3, propertyId?: string): Promise<string[]> {
        // Business Logic: 
        // 1. Check next 'daysToCheck' days.
        // 2. Schedule logic (Property fallback to Admin)
        // 3. Slot duration: 1 hour (for simplicity)

        const availableSlots: string[] = [];
        const now = new Date();
        const rangeStart = startDate;
        const rangeEnd = addDays(startDate, daysToCheck);

        // Fetch all appointments in this big range to memory to avoid N+1 queries
        // Optimisation: We could query per day, but fetching 3 days is cheap.
        const existingAppointments = await this.repository.findByRange(rangeStart, rangeEnd);

        let schedule = null;
        if (this.getScheduleUseCase) {
            if (propertyId) {
                schedule = await this.getScheduleUseCase.execute(propertyId, ScheduleEntityType.PROPERTY);
                // If the property has no active schedule days set, fallback to global admin schedule
                const activeDays = schedule.weeklySchedule.some((day: any) => day.isActive);
                if (!activeDays) {
                    schedule = await this.getScheduleUseCase.execute('admin', ScheduleEntityType.USER);
                }
            } else {
                schedule = await this.getScheduleUseCase.execute('admin', ScheduleEntityType.USER);
            }
        }

        // Generate candidate slots
        for (let i = 0; i < daysToCheck; i++) {
            const currentDay = addDays(rangeStart, i);
            const dayOfWeek = currentDay.getDay();

            let daySlots = [];
            if (schedule) {
                const config = schedule.weeklySchedule.find(s => s.dayOfWeek === dayOfWeek);
                if (!config || !config.isActive) continue; // Closed this day
                daySlots = config.slots;
            } else {
                daySlots = [{ start: '09:00', end: '18:00' }]; // Default Fallback
            }

            for (const slotLimit of daySlots) {
                const startParts = slotLimit.start.split(':');
                const endParts = slotLimit.end.split(':');

                const startHour = startParts[0] ? parseInt(startParts[0], 10) : 9;
                const startMin = startParts[1] ? parseInt(startParts[1], 10) : 0;
                const endHour = endParts[0] ? parseInt(endParts[0], 10) : 18;

                // generate 1-hour slots within this timeframe
                for (let hour = startHour; hour < endHour; hour++) {
                    const slotStart = setMinutes(setHours(currentDay, hour), startMin);
                    const slotEnd = setMinutes(setHours(currentDay, hour + 1), startMin);

                    // Skip past slots
                    if (isBefore(slotStart, now)) continue;

                    // Check collision
                    const isOccupied = existingAppointments.some(appt => {
                        const apptStart = appt.startTime;
                        const apptEnd = appt.endTime;
                        return (slotStart < apptEnd && slotEnd > apptStart);
                    });

                    if (!isOccupied) {
                        availableSlots.push(slotStart.toISOString());
                    }
                }
            }
        }

        return availableSlots;
    }
}
