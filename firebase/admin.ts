import * as admin from "firebase-admin";

// ---------------------------------------------------------------------------
// Firebase Admin SDK initializer
//
// Key rules:
//  1. Only call initializeApp() ONCE per process (Next.js HMR can re-import
//     modules, so we guard with admin.apps.length).
//  2. Return the app instance directly — not wrapped in an object — so
//     getAdminAuth / getAdminDb can call admin.auth(app) unambiguously.
//  3. The private key in .env.local must be a single-line string with literal
//     \n sequences (not real newlines). We convert them here just in case.
// ---------------------------------------------------------------------------

let _app: admin.app.App | null = null;
let _initError: string | null = null;

function initializeAdmin(): admin.app.App | null {
    // Already initialized — return cached instance
    if (_app) return _app;

    // Re-use existing Firebase Admin app if it was initialized elsewhere
    // (handles Next.js HMR / module hot-reload)
    if (admin.apps.length > 0) {
        _app = admin.app();
        return _app;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
        const missing: string[] = [];
        if (!projectId) missing.push("FIREBASE_PROJECT_ID");
        if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
        if (!privateKeyRaw) missing.push("FIREBASE_PRIVATE_KEY");
        _initError = `Missing environment variables: ${missing.join(", ")}`;
        console.error("FIREBASE ADMIN ERROR:", _initError);
        console.warn(
            "DEBUG — Firebase-related env keys present:",
            Object.keys(process.env).filter((k) => k.includes("FIREBASE"))
        );
        return null;
    }

    // Normalize the private key:
    //   - Strip surrounding quotes that dotenv sometimes preserves
    //   - Convert literal \n sequences into real newlines (PEM requirement)
    const privateKey = privateKeyRaw
        .replace(/^["']|["']$/g, "")   // strip outer quotes
        .replace(/\\n/g, "\n");         // literal \n → real newline

    try {
        _app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log("✅ Firebase Admin initialized successfully");
        return _app;
    } catch (error: any) {
        _initError = error.message;
        console.error("Firebase Admin initializeApp() failed:", error.message);
        return null;
    }
}

export const getAdminAuth = (): admin.auth.Auth | null => {
    const app = initializeAdmin();
    if (!app) {
        if (_initError) console.error("getAdminAuth failed — init error:", _initError);
        return null;
    }
    return admin.auth(app);
};

export const getAdminDb = (): admin.firestore.Firestore | null => {
    const app = initializeAdmin();
    if (!app) {
        if (_initError) console.error("getAdminDb failed — init error:", _initError);
        return null;
    }
    return admin.firestore(app);
};

export const getAdminError = (): string | null => _initError;
