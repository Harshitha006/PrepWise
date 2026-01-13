import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getFirebaseApp = () => {
  if (getApps().length > 0) return getApp();

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.error("FIREBASE CLIENT ERROR: Missing NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
    return null;
  }

  return initializeApp(firebaseConfig);
};

const app = getFirebaseApp();
const auth = app ? getAuth(app) : (null as any);
const db = app ? getFirestore(app) : (null as any);

export { app, auth, db };
