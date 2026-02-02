import "server-only";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

// Function to ensure app is initialized
function ensureApp() {
    if (!getApps().length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
                ...(privateKey ? { privateKey } : {}),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!
        });
    }
}

let _auth: Auth | undefined;
let _db: Firestore | undefined;

export const adminAuth = new Proxy({} as Auth, {
    get: (_target, prop) => {
        if (!_auth) {
            ensureApp();
            _auth = getAuth();
        }
        const val = _auth[prop as keyof Auth];
        return typeof val === 'function' ? val.bind(_auth) : val;
    }
});

export const adminDb = new Proxy({} as Firestore, {
    get: (_target, prop) => {
        if (!_db) {
            ensureApp();
            _db = getFirestore();
            _db.settings({ ignoreUndefinedProperties: true });
        }
        const val = _db[prop as keyof Firestore];
        return typeof val === 'function' ? val.bind(_db) : val;
    }
});
