import { Appointment } from './Appointment';

export interface AppointmentRepository {
    save(appointment: Appointment): Promise<void>;
    findById(id: string): Promise<Appointment | null>;
    findOverlapping(start: Date, end: Date): Promise<Appointment[]>;
    findByRange(start: Date, end: Date): Promise<Appointment[]>;
    findByUserId(userId: string): Promise<Appointment[]>;
    update(appointment: Appointment): Promise<void>;
}
