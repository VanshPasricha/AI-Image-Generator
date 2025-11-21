import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { UserProfileManager, HistoryManager } from '../_lib/user-manager.js';

// Get user profile
export default asyncHandler(async function handler(req, res) {
  validateMethod(['GET'])(req, res);

  // Auth disabled for presentation - return mock profile
  const mockProfile = {
    profile: {
      name: 'Demo User',
      email: 'demo@example.com',
      displayName: 'Demo User',
      uid: 'demo-uid',
      createdAt: new Date().toISOString()
    }
  };

  return res.status(200).json(mockProfile);
});
