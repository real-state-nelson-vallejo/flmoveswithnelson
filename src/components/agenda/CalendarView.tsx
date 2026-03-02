'use client';

import { useState } from 'react';
import { scheduleAppointmentAction, AppointmentDTO } from '@/actions/agenda/actions';
import { AppointmentType } from '@/backend/agenda/domain/Appointment';


interface CalendarViewProps {
    initialAppointments: AppointmentDTO[];
}

export function CalendarView({ initialAppointments }: CalendarViewProps) {
    const [appointments] = useState(initialAppointments);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(''); // yyyy-mm-dd
    const [time, setTime] = useState(''); // hh:mm
    const [duration, setDuration] = useState('60'); // minutes
    const [type, setType] = useState<AppointmentType>(AppointmentType.GENERAL);
    const [notes, setNotes] = useState('');

    const today = new Date().toISOString().split('T')[0];

    function formatDateTime(dateStr: string) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        }).format(new Date(dateStr));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title || !date || !time) return;

        setIsSubmitting(true);
        try {
            // Construct ISO strings
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
            // Optimistic update or waiting for revalidatePath from server action which triggers page reload usually?
            // In Next.js server actions, revalidatePath refreshes the route.
            // But to be safe/instant, we can't easily optimistic update without the real ID or re-fetching.
            // We'll rely on server refresh.
            window.location.reload();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-8 py-2 min-h-max">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/50">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Scheduled Events
                        <span className="text-sm font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">
                            {appointments.length}
                        </span>
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Manage your property viewings and client meetings</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="group relative overflow-hidden bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Appointment
                    </span>
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-900">Schedule Event</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Event Title</label>
                                <input
                                    required
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Luxury Penthouse Viewing"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        value={date}
                                        min={today}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Duration</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                    >
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="60">1 Hour</option>
                                        <option value="90">1.5 Hours</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Type</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        value={type}
                                        onChange={e => setType(e.target.value as AppointmentType)}
                                    >
                                        <option value="GENERAL">General Discussion</option>
                                        <option value="call">Consultation Call</option>
                                        <option value="property_viewing">Property Viewing</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Add any specific details or client requirements..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm Schedule'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointment List / Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                {appointments.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-center bg-white border border-dashed border-slate-300 rounded-[3rem]">
                        <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-50 flex items-center justify-center ring-8 ring-slate-50/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No events scheduled</h3>
                        <p className="text-slate-500 font-medium mb-8">Your calendar is clear. Ready to book some viewings?</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                        >
                            Schedule Now
                        </button>
                    </div>
                )}

                {appointments.map(app => {
                    const getTypeIcon = (appointmentType: string) => {
                        switch (appointmentType) {
                            case 'PROPERTY_VIEWING':
                                return (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                );
                            case 'CALL':
                                return (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                );
                            default:
                                return (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                );
                        }
                    };

                    const typeStyles = {
                        PROPERTY_VIEWING: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50',
                        CALL: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50',
                        GENERAL: 'bg-slate-50 text-slate-600 border-slate-100 shadow-slate-50'
                    };

                    const startDate = new Date(app.start);
                    const endDate = new Date(app.end);
                    const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                    const statusColor = app.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-amber-500';

                    return (
                        <div
                            key={app.id}
                            className="group relative flex flex-col md:flex-row gap-6 p-8 bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2.5rem] hover:shadow-2xl hover:shadow-indigo-100 hover:scale-[1.01] transition-all duration-500"
                        >
                            {/* Visual Indicator */}
                            <div className={`absolute top-8 left-0 w-1.5 h-16 rounded-r-full ${statusColor} shadow-[0_0_12px_rgba(0,0,0,0.1)]`} />

                            <div className="flex-1 min-w-0 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`p-2.5 rounded-2xl border ${typeStyles[app.type as keyof typeof typeStyles] || typeStyles.GENERAL}`}>
                                                {getTypeIcon(app.type)}
                                            </span>
                                            <h3 className="font-black text-xl text-slate-900 tracking-tight truncate">{app.title}</h3>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${app.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
                                        {app.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Date & Start</span>
                                            <span className="text-sm font-bold text-slate-700">{formatDateTime(app.start)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Duration</span>
                                            <span className="text-sm font-bold text-slate-700">{durationMin} Minutes</span>
                                        </div>
                                    </div>
                                </div>

                                {app.notes && (
                                    <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl italic text-sm text-slate-600 line-clamp-2">
                                        "{app.notes}"
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-row md:flex-col justify-end items-center gap-3">
                                <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
