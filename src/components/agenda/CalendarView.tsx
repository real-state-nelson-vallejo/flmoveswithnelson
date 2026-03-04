'use client';

import { useState, useTransition } from 'react';
import { scheduleAppointmentAction, AppointmentDTO, updateScheduleAction, ScheduleDTO } from '@/actions/agenda/actions';
import { AppointmentType } from '@/backend/agenda/domain/Appointment';
import { ScheduleEntityType, DaySchedule } from '@/backend/agenda/domain/Schedule';
import { ScheduleConfigurator } from './ScheduleConfigurator';

interface CalendarViewProps {
    initialAppointments: AppointmentDTO[];
    initialSchedule?: ScheduleDTO;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CalendarView({ initialAppointments, initialSchedule }: CalendarViewProps) {
    const [activeTab, setActiveTab] = useState<'UPCOMING' | 'AVAILABILITY'>('UPCOMING');

    // --- Upcoming Tab State ---
    const [appointments] = useState(initialAppointments);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [type, setType] = useState<AppointmentType>(AppointmentType.GENERAL);
    const [notes, setNotes] = useState('');

    // --- Availability Tab State ---
    const [schedule, setSchedule] = useState<DaySchedule[]>(
        initialSchedule?.weeklySchedule || []
    );
    const [timezone, setTimezone] = useState(initialSchedule?.timezone || 'America/New_York');
    const [isSavingSchedule, startSavingSchedule] = useTransition();

    const today = new Date().toISOString().split('T')[0];

    function formatDateTime(dateStr: string) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        }).format(new Date(dateStr));
    }

    async function handleScheduleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title || !date || !time) return;

        setIsSubmitting(true);
        try {
            const startDateTime = new Date(`${date}T${time}`);
            const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

            await scheduleAppointmentAction({
                title,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                type,
                notes
            });

            alert('Appointment Scheduled');
            setShowForm(false);
            window.location.reload();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // ScheduleConfigurator handles these locally now.

    function saveAvailability() {
        startSavingSchedule(async () => {
            try {
                await updateScheduleAction('admin', ScheduleEntityType.USER, {
                    timezone,
                    weeklySchedule: schedule
                });
                alert('Availability saved successfully!');
            } catch (error) {
                console.error(error);
                alert('Failed to save availability.');
            }
        });
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">

            {/* TABS HEADER */}
            <div className="flex gap-4 p-1.5 bg-muted/50 backdrop-blur-md rounded-2xl w-fit border border-border shadow-sm">
                <button
                    onClick={() => setActiveTab('UPCOMING')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'UPCOMING'
                        ? 'bg-background text-foreground shadow-md ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    Upcoming Events
                </button>
                <button
                    onClick={() => setActiveTab('AVAILABILITY')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'AVAILABILITY'
                        ? 'bg-background text-foreground shadow-md ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    Availability Limits
                </button>
            </div>

            {/* TAB CONTENT: UPCOMING */}
            {activeTab === 'UPCOMING' && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
                        <div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                                Scheduled Viewings & Calls
                                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                                    {appointments.length}
                                </span>
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm mt-1">Review AI-scheduled and manual appointments.</p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
                        >
                            + New Appointment
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                        {appointments.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-card text-card-foreground border border-dashed border-border rounded-[2rem]">
                                <div className="w-20 h-20 mb-4 rounded-3xl bg-muted flex items-center justify-center ring-4 ring-muted/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-foreground mb-1">Your calendar is clear</h3>
                                <p className="text-muted-foreground text-sm font-medium mb-6">Ready to book some viewings?</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors text-sm"
                                >
                                    Schedule Now
                                </button>
                            </div>
                        )}

                        {appointments.map(app => {
                            const statusColor = app.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-amber-500';
                            return (
                                <div
                                    key={app.id}
                                    className="group relative flex flex-col sm:flex-row gap-5 p-6 bg-card text-card-foreground border border-border rounded-[2rem] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className={`absolute top-6 left-0 w-1 h-12 rounded-r-full ${statusColor}`} />
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="font-black text-lg text-foreground tracking-tight leading-tight truncate">{app.title}</h3>
                                            <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap ${app.status === 'CONFIRMED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                                                {app.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {formatDateTime(app.start)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {Math.round((new Date(app.end).getTime() - new Date(app.start).getTime()) / 60000)}m
                                            </div>
                                        </div>
                                        {app.notes && (
                                            <p className="text-sm text-foreground bg-muted/50 p-3 rounded-xl border border-border line-clamp-2">
                                                {app.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: AVAILABILITY */}
            {activeTab === 'AVAILABILITY' && (
                <ScheduleConfigurator
                    schedule={schedule}
                    onChange={setSchedule}
                    timezone={timezone}
                    onTimezoneChange={setTimezone}
                    onSave={saveAvailability}
                    isSaving={isSavingSchedule}
                />
            )}

            {/* Create Appointment Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card text-card-foreground w-full max-w-xl rounded-[2rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-muted/30 sticky top-0 z-10">
                            <h3 className="text-xl font-black text-foreground">Schedule Event</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto">
                            <form onSubmit={handleScheduleSubmit} className="p-6 md:p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Event Title</label>
                                    <input
                                        required
                                        className="w-full p-3.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-medium text-foreground placeholder:text-muted-foreground"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. Luxury Penthouse Viewing"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-3.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all font-medium text-foreground"
                                            value={date}
                                            min={today}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full p-3.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all font-medium text-foreground"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Duration</label>
                                        <select
                                            className="w-full p-3.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all font-medium text-foreground"
                                            value={duration}
                                            onChange={e => setDuration(e.target.value)}
                                        >
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="60">1 Hour</option>
                                            <option value="90">1.5 Hours</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Type</label>
                                        <select
                                            className="w-full p-3.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all font-medium text-foreground"
                                            value={type}
                                            onChange={e => setType(e.target.value as AppointmentType)}
                                        >
                                            <option value="GENERAL">General Discussion</option>
                                            <option value="call">Consultation Call</option>
                                            <option value="property_viewing">Property Viewing</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Notes (Optional)</label>
                                    <textarea
                                        className="w-full p-3.5 bg-background border border-input rounded-xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring transition-all font-medium resize-none text-foreground placeholder:text-muted-foreground"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Add specific details or instructions..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary text-primary-foreground p-4 justify-center flex rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-lg mt-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Processing...' : 'Confirm Schedule'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
