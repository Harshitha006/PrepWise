import * as admin from "firebase-admin";

const initializeAdmin = () => {
    if (admin.apps.length > 0) return admin.app();

    try {
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            console.error("FIREBASE ADMIN ERROR: Missing environment variables in .env.local");
            return null;
        }
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            // Remove potential surrounding quotes that might have been captured
            privateKey = privateKey.replace(/^['"]|['"]$/g, '');
            // Handle both literal \n and actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (error) {
        console.error("Firebase admin initialization error:", error);
        return null;
    }
};

const app = initializeAdmin();

export const adminDb = app ? admin.firestore() : (null as unknown as admin.firestore.Firestore);
export const adminAuth = app ? admin.auth() : (null as unknown as admin.auth.Auth);
