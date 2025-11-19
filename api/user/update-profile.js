import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError, validators } from '../_lib/error-handler.js';
import { UserProfileManager } from '../_lib/user-manager.js';

// Update user profile
export default asyncHandler(async function handler(req, res) {
  validateMethod(['PATCH', 'POST'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const { displayName, photoURL, preferences, subscription } = req.body || {};
    
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    if (preferences !== undefined) updates.preferences = preferences;
    if (subscription !== undefined) updates.subscription = subscription;

    const updatedProfile = await UserProfileManager.updateProfile(user.uid, updates);
    return res.status(200).json(updatedProfile);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Update profile error:', error);
    throw new ValidationError('Failed to update profile');
  }
});
