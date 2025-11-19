import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { UserProfileManager } from '../_lib/user-manager.js';

// Get user statistics
export default asyncHandler(async function handler(req, res) {
  validateMethod(['GET'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const stats = await UserProfileManager.getUserStats(user.uid);
    return res.status(200).json(stats);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Get user stats error:', error);
    throw new ValidationError('Failed to get user statistics');
  }
});
