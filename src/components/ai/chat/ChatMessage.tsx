"use client";

import { PropertyCardMini } from "./PropertyCardMini";
import { AppointmentCard } from "./AppointmentCard";

export type ChatMessageContent =
    | { role: 'user' | 'model'; content: string }
    | {
        role: 'tool'; toolType: 'property_results'; toolData: {
            type: 'property_results';
            count: number;
            properties: Array<{
                id: string;
                title: string;
                price: number;
                currency: string;
                location: string;
                specs: string;
                propertyType: string;
                slug: string;
                image?: string;
            }>;
        }
    }
    | {
        role: 'tool'; toolType: 'appointment_confirmation'; toolData: {
            type: 'appointment_confirmation';
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
    };

interface ChatMessageProps {
    message: ChatMessageContent;
    locale: string;
}

export function ChatMessage({ message, locale }: ChatMessageProps) {
    // User or Model text message
    if (message.role === 'user' || message.role === 'model') {
        return (
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/70 backdrop-blur-sm border border-slate-200 text-slate-900'
                        }`}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        );
    }

    // Tool: Property Results
    if (message.role === 'tool' && message.toolType === 'property_results') {
        const data = message.toolData;
        return (
            <div className="flex justify-start">
                <div className="max-w-[90%] space-y-2">
                    <div className="text-xs font-medium text-slate-500 px-2">
                        Found {data.count} {data.count === 1 ? 'property' : 'properties'}
                    </div>
                    <div className="space-y-2">
                        {data.properties.slice(0, 5).map((property) => (
                            <PropertyCardMini
                                key={property.id}
                                property={property}
                                locale={locale}
                            />
                        ))}
                    </div>
                    {data.count > 5 && (
                        <div className="text-xs text-slate-400 px-2">
                            ...and {data.count - 5} more properties
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Tool: Appointment Confirmation
    if (message.role === 'tool' && message.toolType === 'appointment_confirmation') {
        const data = message.toolData;
        return (
            <div className="flex justify-start">
                <div className="max-w-[90%]">
                    <AppointmentCard appointment={data.appointment} />
                </div>
            </div>
        );
    }

    // Fallback for unknown message types
    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-slate-100 text-slate-700">
                <p className="text-sm">Unknown message type</p>
            </div>
        </div>
    );
}
