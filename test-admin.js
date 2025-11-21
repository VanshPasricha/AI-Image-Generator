import admin from './api/_lib/firebase-admin.js';

console.log('Testing Firebase Admin Initialization...');

try {
    const app = admin.app();
    console.log('Firebase Admin App Name:', app.name);
    console.log('Initialization Successful!');
} catch (error) {
    console.error('Initialization Failed:', error);
}
