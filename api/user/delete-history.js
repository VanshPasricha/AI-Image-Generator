import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { HistoryManager } from '../_lib/user-manager.js';

// Delete history item
export default asyncHandler(async function handler(req, res) {
  validateMethod(['DELETE'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const { itemId } = req.query || {};
    
    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    await HistoryManager.deleteHistoryItem(user.uid, itemId);
    return res.status(200).json({ success: true, message: 'History item deleted' });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Delete history item error:', error);
    throw new ValidationError('Failed to delete history item');
  }
});
