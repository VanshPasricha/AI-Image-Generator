// Environment variable validation utility
export function validateEnvironment() {
  const required = [
    'HF_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_STORAGE_BUCKET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please set these environment variables and restart the server.');
    
    // In development, provide more helpful error message
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n💡 Development setup:');
      console.error('1. Copy .env.example to .env');
      console.error('2. Fill in the missing values in .env');
      console.error('3. Restart the development server');
    }
    
    return false;
  }
  
  // Validate specific formats
  const errors = [];
  
  // HF_API_KEY should start with "hf_"
  if (!process.env.HF_API_KEY.startsWith('hf_')) {
    errors.push('HF_API_KEY should start with "hf_"');
  }
  
  // Firebase project ID validation
  if (!/^[a-z0-9-]+$/.test(process.env.FIREBASE_PROJECT_ID)) {
    errors.push('FIREBASE_PROJECT_ID contains invalid characters');
  }
  
  // Firebase private key format validation
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    errors.push('FIREBASE_PRIVATE_KEY should be a valid PEM-formatted private key');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment variable validation errors:', errors);
    return false;
  }
  
  console.log('✅ Environment variables validated successfully');
  return true;
}

// Export environment info for debugging (only in development)
export function getEnvironmentInfo() {
  if (process.env.NODE_ENV === 'production') {
    return { environment: 'production' };
  }
  
  return {
    environment: process.env.NODE_ENV || 'development',
    hasHFKey: !!process.env.HF_API_KEY,
    hfKeyPrefix: process.env.HF_API_KEY?.substring(0, 3) || 'none',
    hasFirebaseConfig: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'not set',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'not set'
  };
}
