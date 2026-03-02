import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Recursively converts Firestore Timestamps (objects with _seconds, _nanoseconds)
 * and Date objects to plain ISO strings to ensure serialization safe for Client Components.
 */
export function serializeFirestoreData(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        return data.map(serializeFirestoreData);
    }

    if (typeof data === 'object') {
        // Handle Firestore Timestamp (duck typing)
        if (data._seconds !== undefined && data._nanoseconds !== undefined) {
            const milliseconds = data._seconds * 1000 + data._nanoseconds / 1000000;
            return new Date(milliseconds).toISOString();
        }

        // Handle Date objects
        if (data instanceof Date) {
            return data.toISOString();
        }

        // Handle nested objects
        const result: any = {};
        for (const key in data) {
            result[key] = serializeFirestoreData(data[key]);
        }
        return result;
    }

    return data;
}
