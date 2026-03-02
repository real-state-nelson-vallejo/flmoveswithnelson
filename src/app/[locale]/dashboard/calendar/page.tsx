import { getUpcomingAppointments } from "@/actions/agenda/actions";
import { CalendarView } from "@/components/agenda/CalendarView";

export default async function CalendarPage() {
    const appointments = await getUpcomingAppointments();

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                <p className="text-muted-foreground">
                    View and manage upcoming appointments and AI-scheduled viewings.
                </p>
            </div>

            <div>
                <CalendarView initialAppointments={appointments} />
            </div>
        </div>
    );
}
