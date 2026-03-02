export interface AppointmentPersistenceModel {
    id: string;
    title: string;
    startTime: number; // Stored as timestamp
    endTime: number;   // Stored as timestamp
    status: string;
    type: string;

    propertyId?: string | undefined;
    leadId?: string | undefined;

    notes?: string | undefined;
    createdAt: number;
    updatedAt: number;
}
