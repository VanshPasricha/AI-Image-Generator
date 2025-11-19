# Vercel Deployment Guide

## Environment Variables Setup

### 1. Add Environment Variables to Vercel
Go to your Vercel dashboard → Project → Settings → Environment Variables and add:

#### Server-side Variables (not exposed to client):
- `HF_API_KEY`: Your Hugging Face API key
- `FIREBASE_PROJECT_ID`: ai-services-e5716
- `FIREBASE_CLIENT_EMAIL`: Your Firebase service account email
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key (with proper line breaks)
- `FIREBASE_STORAGE_BUCKET`: ai-services-e5716.firebasestorage.app

#### Client-side Variables (safe to expose, must start with NEXT_PUBLIC_):
- `NEXT_PUBLIC_FIREBASE_API_KEY`: AIzaSyCaDFtwbuJeb1_JBMjA6nvPyfvxVQkLcqA
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: ai-services-e5716.firebaseapp.com
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: ai-services-e5716
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: ai-services-e5716.firebasestorage.app
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: 436128978712
- `NEXT_PUBLIC_FIREBASE_APP_ID`: 1:436128978712:web:ec469f173281b73bc6706d
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: G-KM7P5B7PDC

### 2. Local Development
Create a `.env` file locally with the same variables for testing.

### 3. Security Notes
- Server-side variables are only available in API routes
- Client-side variables (NEXT_PUBLIC_*) are exposed to browser but are safe for Firebase
- Never commit actual API keys to git
- The Firebase API key is safe to expose as it's restricted by Firebase security rules

### 4. Deployment
After adding environment variables to Vercel:
1. Push your changes
2. Vercel will automatically redeploy with the new variables
3. The Firebase config will load securely from environment variables
