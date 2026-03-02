"use client";

import { Calendar, Clock, CheckCircle, MapPin } from "lucide-react";

interface AppointmentCardProps {
    appointment: {
        id: string;
        status: string;
        title: string;
        startTime: string;
        endTime: string;
        appointmentType: string;
        propertyId?: string;
    };
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
    const startDate = new Date(appointment.startTime);
    const endDate = new Date(appointment.endTime);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getTypeIcon = () => {
        switch (appointment.appointmentType) {
            case 'PROPERTY_VIEWING':
                return <MapPin size={20} className="text-indigo-500" />;
            case 'CALL':
                return <Clock size={20} className="text-blue-500" />;
            default:
                return <Calendar size={20} className="text-slate-500" />;
        }
    };

    const getTypeLabel = () => {
        switch (appointment.appointmentType) {
            case 'PROPERTY_VIEWING':
                return 'Property Viewing';
            case 'CALL':
                return 'Phone Call';
            case 'GENERAL':
                return 'Appointment';
            default:
                return appointment.appointmentType;
        }
    };

    return (
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200 rounded-2xl">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                    {getTypeIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                            Appointment Confirmed
                        </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{appointment.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{getTypeLabel()}</p>
                </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2 p-3 bg-white/70 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Calendar size={16} className="text-indigo-500" />
                    <span className="font-medium">{formatDate(startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock size={16} className="text-indigo-500" />
                    <span className="font-medium">
                        {formatTime(startDate)} - {formatTime(endDate)}
                    </span>
                </div>
            </div>

            {/* Appointment ID */}
            <div className="mt-3 pt-3 border-t border-green-100">
                <p className="text-xs text-slate-400">
                    Confirmation ID: <span className="font-mono text-slate-600">{appointment.id.slice(0, 8)}...</span>
                </p>
            </div>
        </div>
    );
}
