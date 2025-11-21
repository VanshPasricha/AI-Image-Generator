import admin from 'firebase-admin';
import { validateEnv } from './validate-env.js';

// Environment validation
const envValidation = validateEnv();
if (!envValidation.valid) {
  console.error('Firebase Admin initialization failed - environment validation errors:', envValidation.errors);
  throw new Error('Firebase Admin initialization failed - missing required environment variables');
}

// Firebase configuration from environment variables
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};

// Validate Firebase config
const requiredFirebaseFields = ['projectId', 'clientEmail', 'privateKey'];
const missingFields = requiredFirebaseFields.filter(field => !firebaseConfig[field]);
if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
}

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin...');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey
      }),
      storageBucket: firebaseConfig.storageBucket,
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw new Error('Firebase Admin initialization failed');
  }
} else {
  console.log('Firebase Admin already initialized');
}

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
export const db = firestore;

// Configure Firestore settings
try {
  firestore.settings({
    ignoreUndefinedProperties: true,
    timestampsInSnapshots: true
  });
  console.log('Firestore settings configured');
} catch (error) {
  console.warn('Failed to configure Firestore settings:', error.message);
}

// Helper functions for Firebase operations
export const firebaseHelpers = {
  // Get user by UID
  async getUser(uid) {
    try {
      const userRecord = await auth.getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new Error('User not found');
    }
  },

  // Create user document in Firestore
  async createUserDocument(uid, userData) {
    try {
      const userRef = firestore.collection('users').doc(uid);
      await userRef.set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return userRef;
    } catch (error) {
      console.error('Failed to create user document:', error);
      throw new Error('Failed to create user profile');
    }
  },

  // Update user document
  async updateUserDocument(uid, updateData) {
    try {
      const userRef = firestore.collection('users').doc(uid);
      await userRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return userRef;
    } catch (error) {
      console.error('Failed to update user document:', error);
      throw new Error('Failed to update user profile');
    }
  },

  // Get user document
  async getUserDocument(uid) {
    try {
      const userRef = firestore.collection('users').doc(uid);
      const doc = await userRef.get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Failed to get user document:', error);
      throw new Error('Failed to get user profile');
    }
  },

  // Create custom token
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      const token = await auth.createCustomToken(uid, additionalClaims);
      return token;
    } catch (error) {
      console.error('Failed to create custom token:', error);
      throw new Error('Failed to create authentication token');
    }
  },

  // Revoke user tokens
  async revokeUserTokens(uid) {
    try {
      await auth.revokeRefreshTokens(uid);
      return true;
    } catch (error) {
      console.error('Failed to revoke user tokens:', error);
      throw new Error('Failed to revoke user tokens');
    }
  },

  // Delete user
  async deleteUser(uid) {
    try {
      await auth.deleteUser(uid);
      // Also delete user document
      await firestore.collection('users').doc(uid).delete();
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error('Failed to delete user account');
    }
  },

  // Upload file to storage
  async uploadFile(buffer, filename, contentType = 'application/octet-stream') {
    try {
      const bucket = storage.bucket();
      const file = bucket.file(filename);
      await file.save(buffer, {
        metadata: {
          contentType: contentType
        }
      });

      // Make file public
      await file.makePublic();

      return file.publicUrl();
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file');
    }
  },

  // Delete file from storage
  async deleteFile(filename) {
    try {
      const bucket = storage.bucket();
      await bucket.file(filename).delete();
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file');
    }
  },

  // Batch operations helper
  createBatch() {
    return firestore.batch();
  },

  // Transaction helper
  async runTransaction(operation) {
    try {
      return await firestore.runTransaction(operation);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error('Database transaction failed');
    }
  }
};

export default admin;
