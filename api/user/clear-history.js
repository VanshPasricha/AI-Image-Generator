import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { HistoryManager } from '../_lib/user-manager.js';

// Clear all history for user
export default asyncHandler(async function handler(req, res) {
  validateMethod(['DELETE'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const { serviceType } = req.query || {};
    
    const deletedCount = await HistoryManager.clearHistory(user.uid, serviceType);
    return res.status(200).json({ 
      success: true, 
      message: `Cleared ${deletedCount} history items`,
      deletedCount 
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Clear history error:', error);
    throw new ValidationError('Failed to clear history');
  }
});
