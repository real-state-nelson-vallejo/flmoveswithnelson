
import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";
import { addDays, setHours, setMinutes, isBefore } from "date-fns";

export class GetAvailableSlots {
    constructor(private readonly repository: AppointmentRepository) { }

    async execute(startDate: Date = new Date(), daysToCheck: number = 3): Promise<string[]> {
        // Business Logic: 
        // 1. Check next 'daysToCheck' days.
        // 2. Working hours: 9 AM - 6 PM (18:00)
        // 3. Slot duration: 1 hour (for simplicity)

        const availableSlots: string[] = [];
        const now = new Date();
        const rangeStart = startDate;
        const rangeEnd = addDays(startDate, daysToCheck);

        // Fetch all appointments in this big range to memory to avoid N+1 queries
        // Optimisation: We could query per day, but fetching 3 days is cheap.
        const existingAppointments = await this.repository.findByRange(rangeStart, rangeEnd);

        // Generate candidate slots
        for (let i = 0; i < daysToCheck; i++) {
            const currentDay = addDays(rangeStart, i);

            // Working hours 9:00 to 18:00
            for (let hour = 9; hour < 18; hour++) {
                const slotStart = setMinutes(setHours(currentDay, hour), 0);
                const slotEnd = setMinutes(setHours(currentDay, hour + 1), 0);

                // Skip past slots
                if (isBefore(slotStart, now)) continue;

                // Check collision
                const isOccupied = existingAppointments.some(appt => {
                    const apptStart = appt.startTime;
                    const apptEnd = appt.endTime;
                    // Simple overlap check
                    return (slotStart < apptEnd && slotEnd > apptStart);
                });

                if (!isOccupied) {
                    availableSlots.push(slotStart.toISOString());
                }

                // Limit suggestions? No, return all, let the agent pick 2 or 3.
            }
        }

        return availableSlots;
    }
}
