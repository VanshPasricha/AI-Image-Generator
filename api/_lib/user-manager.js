// Enhanced user profile and history management
import { auth, firestore, firebaseHelpers } from './firebase-admin.js';
import { ValidationError } from './error-handler.js';

export class UserProfileManager {
  // Get or create user profile
  static async getOrCreateProfile(uid) {
    try {
      // First try to get existing profile
      let profile = await firebaseHelpers.getUserDocument(uid);
      
      if (!profile) {
        // Get user from Firebase Auth
        const userRecord = await firebaseHelpers.getUser(uid);
        
        // Create new profile
        profile = {
          uid: uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
          photoURL: userRecord.photoURL || null,
          emailVerified: userRecord.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: false
            }
          },
          usage: {
            totalRequests: 0,
            imageGenerations: 0,
            voiceToText: 0,
            chatMessages: 0,
            summarizations: 0
          },
          subscription: {
            tier: 'free',
            limits: {
              dailyRequests: 100,
              monthlyRequests: 1000
            }
          }
        };
        
        await firebaseHelpers.createUserDocument(uid, profile);
      }
      
      return profile;
    } catch (error) {
      console.error('Failed to get or create user profile:', error);
      throw new ValidationError('Failed to load user profile');
    }
  }

  // Update user profile
  static async updateProfile(uid, updates) {
    try {
      const allowedFields = [
        'displayName',
        'photoURL',
        'preferences',
        'subscription'
      ];
      
      const filteredUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = value;
        }
      }
      
      if (Object.keys(filteredUpdates).length === 0) {
        throw new ValidationError('No valid fields to update');
      }
      
      await firebaseHelpers.updateUserDocument(uid, filteredUpdates);
      return await firebaseHelpers.getUserDocument(uid);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new ValidationError('Failed to update profile');
    }
  }

  // Update usage statistics
  static async updateUsage(uid, serviceType, increment = 1) {
    try {
      const profile = await this.getOrCreateProfile(uid);
      
      const usageField = serviceType === 'image' ? 'imageGenerations' :
                        serviceType === 'voice' ? 'voiceToText' :
                        serviceType === 'chat' ? 'chatMessages' :
                        serviceType === 'summarize' ? 'summarizations' : null;
      
      if (!usageField) {
        throw new ValidationError('Invalid service type');
      }
      
      const updates = {
        [`usage.${usageField}`]: profile.usage[usageField] + increment,
        'usage.totalRequests': profile.usage.totalRequests + increment,
        'updatedAt': new Date().toISOString()
      };
      
      await firebaseHelpers.updateUserDocument(uid, updates);
    } catch (error) {
      console.error('Failed to update usage:', error);
      // Don't throw error for usage updates - it's non-critical
    }
  }

  // Check user limits
  static async checkLimits(uid, serviceType) {
    try {
      const profile = await this.getOrCreateProfile(uid);
      const limits = profile.subscription.limits;
      
      // Check daily limit
      const today = new Date().toDateString();
      const dailyUsage = await this.getDailyUsage(uid, today);
      
      if (dailyUsage >= limits.dailyRequests) {
        throw new ValidationError('Daily request limit exceeded');
      }
      
      // Check monthly limit
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyUsage = await this.getMonthlyUsage(uid, currentMonth);
      
      if (monthlyUsage >= limits.monthlyRequests) {
        throw new ValidationError('Monthly request limit exceeded');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Failed to check limits:', error);
      // Allow request if we can't check limits
      return true;
    }
  }

  // Get daily usage
  static async getDailyUsage(uid, date) {
    try {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const snapshot = await firestore
        .collection('history')
        .where('userId', '==', uid)
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<', endOfDay)
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.error('Failed to get daily usage:', error);
      return 0;
    }
  }

  // Get monthly usage
  static async getMonthlyUsage(uid, yearMonth) {
    try {
      const startOfMonth = new Date(yearMonth + '-01');
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      
      const snapshot = await firestore
        .collection('history')
        .where('userId', '==', uid)
        .where('createdAt', '>=', startOfMonth)
        .where('createdAt', '<', endOfMonth)
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.error('Failed to get monthly usage:', error);
      return 0;
    }
  }

  // Get user statistics
  static async getUserStats(uid) {
    try {
      const profile = await this.getOrCreateProfile(uid);
      
      const stats = {
        profile: {
          displayName: profile.displayName,
          email: profile.email,
          createdAt: profile.createdAt,
          subscriptionTier: profile.subscription.tier
        },
        usage: profile.usage,
        limits: profile.subscription.limits,
        dailyUsage: await this.getDailyUsage(uid, new Date().toDateString()),
        monthlyUsage: await this.getMonthlyUsage(uid, new Date().toISOString().slice(0, 7))
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw new ValidationError('Failed to get user statistics');
    }
  }
}

export class HistoryManager {
  // Enhanced save history with better metadata
  static async saveHistoryItem(data) {
    try {
      const historyItem = {
        ...data,
        createdAt: new Date(),
        status: 'completed',
        metadata: {
          ...data.metadata,
          userAgent: data.metadata?.userAgent || 'unknown',
          ipAddress: data.metadata?.ipAddress || null,
          processingTime: data.metadata?.processingTime || null,
          cost: data.metadata?.cost || null
        }
      };
      
      const docRef = await firestore.collection('history').add(historyItem);
      
      // Update user usage
      await UserProfileManager.updateUsage(data.userId, data.serviceType);
      
      return docRef.id;
    } catch (error) {
      console.error('Failed to save history item:', error);
      throw new ValidationError('Failed to save to history');
    }
  }

  // Get history with pagination and filtering
  static async getHistory(uid, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        serviceType = null,
        startDate = null,
        endDate = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;
      
      let query = firestore
        .collection('history')
        .where('userId', '==', uid);
      
      // Apply filters
      if (serviceType) {
        query = query.where('serviceType', '==', serviceType);
      }
      
      if (startDate) {
        query = query.where('createdAt', '>=', new Date(startDate));
      }
      
      if (endDate) {
        query = query.where('createdAt', '<=', new Date(endDate));
      }
      
      // Apply sorting and pagination
      query = query.orderBy(sortBy, sortOrder);
      query = query.limit(limit);
      
      if (offset > 0) {
        // For offset, we need to use a different approach with Firestore
        const allDocs = await query.get();
        const docs = allDocs.docs.slice(offset);
        return {
          items: docs.map(doc => ({ id: doc.id, ...doc.data() })),
          total: allDocs.size,
          hasMore: false
        };
      }
      
      const snapshot = await query.get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get total count (approximate)
      let countQuery = firestore
        .collection('history')
        .where('userId', '==', uid);
      
      if (serviceType) {
        countQuery = countQuery.where('serviceType', '==', serviceType);
      }
      
      if (startDate) {
        countQuery = countQuery.where('createdAt', '>=', new Date(startDate));
      }
      
      if (endDate) {
        countQuery = countQuery.where('createdAt', '<=', new Date(endDate));
      }
      
      const countSnapshot = await countQuery.get();
      
      return {
        items,
        total: countSnapshot.size,
        hasMore: items.length === limit && offset + items.length < countSnapshot.size
      };
    } catch (error) {
      console.error('Failed to get history:', error);
      throw new ValidationError('Failed to retrieve history');
    }
  }

  // Get specific history item
  static async getHistoryItem(uid, itemId) {
    try {
      const doc = await firestore
        .collection('history')
        .doc(itemId)
        .get();
      
      if (!doc.exists) {
        throw new ValidationError('History item not found');
      }
      
      const item = { id: doc.id, ...doc.data() };
      
      // Verify ownership
      if (item.userId !== uid) {
        throw new ValidationError('Access denied');
      }
      
      return item;
    } catch (error) {
      console.error('Failed to get history item:', error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Failed to retrieve history item');
    }
  }

  // Delete history item
  static async deleteHistoryItem(uid, itemId) {
    try {
      const item = await this.getHistoryItem(uid, itemId);
      
      // Also delete associated files from storage if any
      if (item.output && item.output.startsWith('https://storage.googleapis.com/')) {
        try {
          const filename = item.output.split('/').pop();
          await firebaseHelpers.deleteFile(`users/${uid}/${filename}`);
        } catch (error) {
          console.warn('Failed to delete associated file:', error);
        }
      }
      
      await firestore.collection('history').doc(itemId).delete();
      return true;
    } catch (error) {
      console.error('Failed to delete history item:', error);
      throw new ValidationError('Failed to delete history item');
    }
  }

  // Clear all history for user
  static async clearHistory(uid, serviceType = null) {
    try {
      let query = firestore
        .collection('history')
        .where('userId', '==', uid);
      
      if (serviceType) {
        query = query.where('serviceType', '==', serviceType);
      }
      
      const snapshot = await query.get();
      const batch = firebaseHelpers.createBatch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return snapshot.size;
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw new ValidationError('Failed to clear history');
    }
  }

  // Search history
  static async searchHistory(uid, searchTerm, options = {}) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation that filters by input/output content
      const { limit = 20 } = options;
      
      const snapshot = await firestore
        .collection('history')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(100) // Get more items to filter through
        .get();
      
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => {
          const searchText = `${item.input || ''} ${item.output || ''}`.toLowerCase();
          return searchText.includes(searchTerm.toLowerCase());
        })
        .slice(0, limit);
      
      return {
        items,
        total: items.length,
        searchTerm
      };
    } catch (error) {
      console.error('Failed to search history:', error);
      throw new ValidationError('Failed to search history');
    }
  }
}

export default {
  UserProfileManager,
  HistoryManager
};
