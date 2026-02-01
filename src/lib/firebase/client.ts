import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    ...(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && { authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }),
    ...(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }),
    ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }),
    ...(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && { messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }),
    ...(process.env.NEXT_PUBLIC_FIREBASE_APP_ID && { appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID })
};

// Initialize Firebase (Singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export default app;
