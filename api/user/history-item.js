import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { HistoryManager } from '../_lib/user-manager.js';

// Get specific history item
export default asyncHandler(async function handler(req, res) {
  validateMethod(['GET'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const { itemId } = req.query || {};
    
    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    const item = await HistoryManager.getHistoryItem(user.uid, itemId);
    return res.status(200).json(item);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Get history item error:', error);
    throw new ValidationError('Failed to retrieve history item');
  }
});
