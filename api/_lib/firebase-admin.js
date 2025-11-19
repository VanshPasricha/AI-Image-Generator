import admin from 'firebase-admin';
import 'firebase-admin/storage';

let app;

if (!admin.apps || admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin not fully configured. Some API routes will fail until env vars are set.');
  }

  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
    });
  } catch (e) {
    // In case of hot-reload duplication in dev
    app = admin.app();
  }
} else {
  app = admin.app();
}

export { app };
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage ? admin.storage() : null;
export default admin;
