import "server-only";
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Singleton instance
let app: admin.app.App;

function getFirebaseAdminApp(): admin.app.App {
    if (app) {
        return app;
    }

    // Check if any app is already initialized
    if (admin.apps.length > 0) {
        app = admin.app();
        return app;
    }

    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Note: In build time, these might be missing, so we only throw if we actually try to initialize
    // which happens inside the Proxy (Lazily).
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
        // Log warning instead of throwing immediately to allow build to pass if it doesn't use DB
        console.warn('Firebase Admin env vars missing. DB connection will fail if used.');
    }

    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!
    });

    return app;
}

export const adminAuth = new Proxy({} as admin.auth.Auth, {
    get: (_target, prop) => {
        const auth = getFirebaseAdminApp().auth();
        const val = auth[prop as keyof admin.auth.Auth];
        return typeof val === 'function' ? val.bind(auth) : val;
    }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
    get: (_target, prop) => {
        const db = getFirebaseAdminApp().firestore();
        try {
            db.settings({ ignoreUndefinedProperties: true });
        } catch {
            // Ignore if settings already applied
        }
        const val = db[prop as keyof admin.firestore.Firestore];
        return typeof val === 'function' ? val.bind(db) : val;
    }
});
