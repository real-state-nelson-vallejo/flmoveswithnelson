import { getUpcomingAppointments, getScheduleAction } from "@/actions/agenda/actions";
import { CalendarView } from "@/components/agenda/CalendarView";
import { ScheduleEntityType } from "@/backend/agenda/domain/Schedule";

export default async function CalendarPage() {
    const appointments = await getUpcomingAppointments();
    // Assuming 'admin' is the main user id for MVP
    const schedule = await getScheduleAction('admin', ScheduleEntityType.USER);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                <p className="text-muted-foreground">
                    View and manage upcoming appointments and configure your AI availability.
                </p>
            </div>

            <div className="mt-8">
                <CalendarView initialAppointments={appointments} initialSchedule={schedule} />
            </div>
        </div>
    );
}
