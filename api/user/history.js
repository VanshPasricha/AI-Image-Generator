import { verifyAuth } from '../_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError } from '../_lib/error-handler.js';
import { HistoryManager } from '../_lib/user-manager.js';

// Get user history with pagination and filtering
export default asyncHandler(async function handler(req, res) {
  validateMethod(['GET'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  try {
    const {
      limit = 20,
      offset = 0,
      serviceType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query || {};

    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      serviceType,
      startDate,
      endDate,
      sortBy,
      sortOrder
    };

    const history = await HistoryManager.getHistory(user.uid, options);
    return res.status(200).json(history);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Get history error:', error);
    throw new ValidationError('Failed to retrieve history');
  }
});
