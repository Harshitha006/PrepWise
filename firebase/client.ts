import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ---------------------------------------------------------------------------
// Bug fixes applied here:
//
// 1. GoogleAuthProvider was being instantiated at module level unconditionally.
//    When app is null (missing env vars) this crashes on import — especially
//    in SSR where the env vars are absent on the client bundle. It is now
//    only created when the app is successfully initialized.
//
// 2. auth / db / googleProvider were typed as `null as any` when the app is
//    absent, masking crashes. They are now properly typed as nullable so that
//    callers (AuthContext) can guard against null before use.
// ---------------------------------------------------------------------------

function getFirebaseApp(): FirebaseApp | null {
  // Return the already-initialized app if one exists (handles HMR / re-imports)
  if (getApps().length > 0) return getApp();

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.error(
      "FIREBASE CLIENT ERROR: Missing NEXT_PUBLIC_FIREBASE_API_KEY. " +
        "Add it to .env.local and restart the dev server."
    );
    return null;
  }

  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

// Derive auth, db, and googleProvider only when app is non-null.
// Using proper nullable types instead of `null as any` so that any
// call-site that forgets to null-check gets a TypeScript error, not a runtime crash.
const auth: Auth | null = app ? getAuth(app) : null;
const db: Firestore | null = app ? getFirestore(app) : null;
// Fix: GoogleAuthProvider instantiated ONLY when app is valid — prevents SSR crash on import.
const googleProvider: GoogleAuthProvider | null = app ? new GoogleAuthProvider() : null;

export { app, auth, db, googleProvider };
