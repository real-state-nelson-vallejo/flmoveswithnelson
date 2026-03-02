import { tool, z } from 'genkit';
import { CheckAvailability } from '@/backend/agenda/application/CheckAvailability';
import { ScheduleAppointment } from '@/backend/agenda/application/ScheduleAppointment';
import { GetAvailableSlots } from '@/backend/agenda/application/GetAvailableSlots';
import { GetUserAppointments } from '@/backend/agenda/application/GetUserAppointments';
import { RescheduleAppointment } from '@/backend/agenda/application/RescheduleAppointment';
import { CancelAppointment } from '@/backend/agenda/application/CancelAppointment';
import { FirestoreAppointmentRepository } from '@/backend/agenda/infrastructure/FirestoreAppointmentRepository';
import { AppointmentType } from '@/backend/agenda/domain/Appointment';

const appointmentRepository = new FirestoreAppointmentRepository();
const checkAvailability = new CheckAvailability(appointmentRepository);
const scheduleAppointment = new ScheduleAppointment(appointmentRepository);
const getAvailableSlots = new GetAvailableSlots(appointmentRepository);
const getUserAppointments = new GetUserAppointments(appointmentRepository);
const rescheduleAppointment = new RescheduleAppointment(appointmentRepository, checkAvailability);
const cancelAppointment = new CancelAppointment(appointmentRepository);

const TOOLS_NAME = 'agendaToolsInstances_v2'; // bumped to pick up CancelAppointment

export const getAgendaTools = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((globalThis as any)[TOOLS_NAME]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any)[TOOLS_NAME];
    }

    const parseDate = (dateStr: string): Date => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
        return d;
    };

    const tools = [
        // ── Check Availability ──────────────────────────────────────────────────
        tool(
            {
                name: 'checkAvailability',
                description: 'Check if a specific time slot is available for an appointment.',
                inputSchema: z.object({
                    startTime: z.string().describe('Start time in ISO format (e.g. 2024-01-01T10:00:00)'),
                    endTime: z.string().describe('End time in ISO format'),
                }),
                outputSchema: z.boolean().describe('True if available, false if overlapping'),
            },
            async (input) => {
                return checkAvailability.execute(parseDate(input.startTime), parseDate(input.endTime));
            }
        ),

        // ── Schedule Appointment ────────────────────────────────────────────────
        tool(
            {
                name: 'scheduleAppointment',
                description: 'Schedule a new appointment (viewing, call, etc). ALWAYS call checkAvailability or get_available_slots first.',
                inputSchema: z.object({
                    title: z.string().describe('Title or summary of the appointment'),
                    startTime: z.string().describe('Start time in ISO format'),
                    endTime: z.string().describe('End time in ISO format'),
                    type: z.enum(['PROPERTY_VIEWING', 'CALL', 'GENERAL']).describe('Type of appointment'),
                    propertyId: z.string().optional().describe('ID of the property if applicable'),
                    leadId: z.string().optional().describe('ID of the lead – use the one from your context.'),
                    notes: z.string().optional().describe('Additional notes')
                }),
                outputSchema: z.object({
                    type: z.literal('appointment_confirmation'),
                    appointment: z.object({
                        id: z.string(),
                        status: z.string(),
                        title: z.string(),
                        startTime: z.string(),
                        endTime: z.string(),
                        appointmentType: z.string(),
                        propertyId: z.string().optional()
                    })
                }),
            },
            async (input) => {
                const start = parseDate(input.startTime);
                const end = parseDate(input.endTime);

                const result = await scheduleAppointment.execute({
                    title: input.title,
                    startTime: start,
                    endTime: end,
                    type: input.type as AppointmentType,
                    ...(input.propertyId ? { propertyId: input.propertyId } : {}),
                    ...(input.leadId ? { leadId: input.leadId } : {}),
                    ...(input.notes ? { notes: input.notes } : {}),
                });

                return {
                    type: 'appointment_confirmation' as const,
                    appointment: {
                        id: result.id,
                        status: result.status as string,
                        title: input.title,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        appointmentType: input.type,
                        propertyId: input.propertyId,
                    },
                };
            }
        ),

        // ── Get Available Slots ─────────────────────────────────────────────────
        tool(
            {
                name: 'get_available_slots',
                description: 'Get a list of available appointment slots for the next few days. Use BEFORE proposing a time to the user.',
                inputSchema: z.object({
                    startDate: z.string().optional().describe('Start date to check from (ISO). Defaults to now.'),
                    days: z.number().optional().default(3).describe('Number of days to check.')
                }),
                outputSchema: z.object({
                    availableSlots: z.array(z.string())
                })
            },
            async (input) => {
                const start = input.startDate ? new Date(input.startDate) : new Date();
                const slots = await getAvailableSlots.execute(start, input.days);
                return { availableSlots: slots };
            }
        ),

        // ── Get User Appointments ───────────────────────────────────────────────
        tool(
            {
                name: 'get_user_appointments',
                description: 'Get a list of upcoming appointments for the current user/lead.',
                inputSchema: z.object({
                    leadId: z.string().describe('ID of the lead – must match the one in your context.')
                }),
                outputSchema: z.object({
                    appointments: z.array(z.object({
                        id: z.string(),
                        title: z.string(),
                        startTime: z.string(),
                        status: z.string()
                    }))
                })
            },
            async (input) => {
                const appts = await getUserAppointments.execute(input.leadId);
                return {
                    appointments: appts.map(a => ({
                        id: a.id,
                        title: a.title,
                        startTime: a.startTime.toISOString(),
                        status: a.status,
                    })),
                };
            }
        ),

        // ── Reschedule Appointment ──────────────────────────────────────────────
        // Security: leadId is REQUIRED and compared server-side against the appointment owner.
        tool(
            {
                name: 'reschedule_appointment',
                description: 'Reschedule an existing appointment to a new time. Only works for appointments that belong to the current user.',
                inputSchema: z.object({
                    appointmentId: z.string().describe('ID of the appointment to reschedule'),
                    newStartTime: z.string().describe('New start time (ISO)'),
                    newEndTime: z.string().describe('New end time (ISO)'),
                    leadId: z.string().describe('REQUIRED. Must be the same leadId from your context. Server validates ownership.'),
                }),
                outputSchema: z.object({
                    type: z.literal('appointment_confirmation'),
                    appointment: z.object({
                        id: z.string(),
                        title: z.string(),
                        startTime: z.string(),
                        endTime: z.string(),
                        status: z.string()
                    })
                })
            },
            async (input) => {
                // Server-side ownership enforced inside RescheduleAppointment.execute()
                const updated = await rescheduleAppointment.execute(
                    input.appointmentId,
                    parseDate(input.newStartTime),
                    parseDate(input.newEndTime),
                    input.leadId,  // ← ownership check
                );
                return {
                    type: 'appointment_confirmation' as const,
                    appointment: {
                        id: updated.id,
                        title: updated.title,
                        startTime: updated.startTime.toISOString(),
                        endTime: updated.endTime.toISOString(),
                        status: updated.status,
                    },
                };
            }
        ),

        // ── Cancel Appointment ──────────────────────────────────────────────────
        // Security: leadId is REQUIRED and compared server-side against the appointment owner.
        tool(
            {
                name: 'cancel_appointment',
                description: 'Cancel an existing appointment. Only works for appointments that belong to the current user.',
                inputSchema: z.object({
                    appointmentId: z.string().describe('ID of the appointment to cancel'),
                    leadId: z.string().describe('REQUIRED. Must be the same leadId from your context. Server validates ownership.'),
                }),
                outputSchema: z.object({
                    success: z.boolean(),
                    message: z.string(),
                })
            },
            async (input) => {
                // Server-side ownership enforced inside CancelAppointment.execute()
                await cancelAppointment.execute(input.appointmentId, input.leadId);
                return {
                    success: true,
                    message: `Appointment ${input.appointmentId} has been successfully cancelled.`,
                };
            }
        ),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[TOOLS_NAME] = tools;
    return tools;
};
