import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError, validators } from '../_lib/error-handler.js';
import { UserProfileManager } from '../_lib/user-manager.js';

// Update user profile
export default asyncHandler(async function handler(req, res) {
  validateMethod(['PATCH', 'POST'])(req, res);

  // Auth disabled for presentation - just return success
  const { name, displayName } = req.body || {};

  const updatedProfile = {
    profile: {
      name: name || displayName || 'Demo User',
      email: 'demo@example.com',
      displayName: name || displayName || 'Demo User',
      uid: 'demo-uid',
      updatedAt: new Date().toISOString()
    }
  };

  return res.status(200).json(updatedProfile);
});
