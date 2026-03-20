import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminError } from '@/firebase/admin';

export async function GET() {
  const adminAuth = getAdminAuth();
  const adminError = getAdminError();
  
  return NextResponse.json({ 
    projectId: process.env.FIREBASE_PROJECT_ID || 'MISSING',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
    hasKey: !!process.env.FIREBASE_PRIVATE_KEY,
    adminInitialized: !!adminAuth,
    adminError: adminError || 'NONE'
  });
}
