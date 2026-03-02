import { Appointment } from "@/backend/agenda/domain/Appointment";
import { AppointmentRepository } from "@/backend/agenda/domain/AppointmentRepository";
import { adminDb } from "@/lib/firebase/admin";
import { AppointmentPersistenceModel } from "./dto/AppointmentPersistence";

const COLLECTION_NAME = "appointments";

export class FirestoreAppointmentRepository implements AppointmentRepository {
    async save(appointment: Appointment): Promise<void> {
        const persistence = appointment.toPersistence();
        await adminDb.collection(COLLECTION_NAME).doc(appointment.id).set(persistence);
    }

    async findById(id: string): Promise<Appointment | null> {
        const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data() as AppointmentPersistenceModel;
        return Appointment.fromPersistence(data);
    }

    async findOverlapping(start: Date, end: Date): Promise<Appointment[]> {
        const startTimestamp = start.getTime();
        const endTimestamp = end.getTime();

        // Naive implementation for MVP similar to findByRange
        // We fetch a broad range or just use query constraints we can support
        // Firestore limitation: cannot filter on two different fields with inequalities if not coupled carefully.
        // Assuming findByRange logic is sufficient for fetching candidates, then filter in memory/app logic if needed.

        // Using findByRange logic (Appointments starting in this range)
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('startTime', '>=', startTimestamp)
            .where('startTime', '<=', endTimestamp)
            .get();

        return snapshot.docs.map(doc => Appointment.fromPersistence(doc.data() as AppointmentPersistenceModel));
    }

    async findByRange(start: Date, end: Date): Promise<Appointment[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('startTime', '>=', start.getTime())
            .where('startTime', '<=', end.getTime())
            .get();

        return snapshot.docs.map(doc => Appointment.fromPersistence(doc.data() as AppointmentPersistenceModel));
    }

    async findByUserId(userId: string): Promise<Appointment[]> {
        const snapshot = await adminDb.collection(COLLECTION_NAME)
            .where('leadId', '==', userId)
            // .where('startTime', '>=', Date.now()) // Optional: only future appointments? For now, all.
            .orderBy('startTime', 'asc')
            .get();

        return snapshot.docs.map(doc => Appointment.fromPersistence(doc.data() as AppointmentPersistenceModel));
    }

    async update(appointment: Appointment): Promise<void> {
        // Firestore 'set' acts as upsert effectively, but we can use 'update' if we want partial.
        // Since domain object is full, set is fine.
        return this.save(appointment);
    }
}
