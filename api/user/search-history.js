import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { HistoryManager } from '../_lib/user-manager.js';

// Search history
export default asyncHandler(async function handler(req, res) {
  validateMethod(['GET'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const { searchTerm, limit = 20 } = req.query || {};
    
    if (!searchTerm) {
      throw new ValidationError('Search term is required');
    }

    const options = {
      limit: parseInt(limit) || 20
    };

    const searchResults = await HistoryManager.searchHistory(user.uid, searchTerm, options);
    return res.status(200).json(searchResults);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Search history error:', error);
    throw new ValidationError('Failed to search history');
  }
});
