import { doc, setDoc, getDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

export interface AIUsageRecord {
  userId: string;
  userEmail: string;
  feature: string;
  timestamp: Date;
  inputLength?: number;
  outputLength?: number;
  tokensUsed?: number;
  cost?: number;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  featuresUsed: { [feature: string]: number };
  dailyUsage: { [date: string]: number };
  lastUsed: Date | null;
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export class AIUsageService {
  private static readonly COLLECTION = 'ai_usage';
  private static readonly STATS_COLLECTION = 'ai_usage_stats';

  /**
   * Track AI feature usage
   */
  static async trackUsage(
    feature: string,
    inputLength?: number,
    outputLength?: number,
    tokensUsed?: number,
    cost?: number
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        console.warn('No authenticated user for AI usage tracking');
        return;
      }

      const usageRecord: AIUsageRecord = {
        userId: user.uid,
        userEmail: user.email,
        feature,
        timestamp: new Date(),
        inputLength,
        outputLength,
        tokensUsed,
        cost,
      };

      // Save individual usage record
      const usageId = `${user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, this.COLLECTION, usageId), usageRecord);

      // Update user's usage statistics
      await this.updateUserStats(user.uid, user.email, feature, tokensUsed || 0, cost || 0);

      console.log('✅ AI usage tracked:', feature, 'for user:', user.email);
    } catch (error) {
      console.error('❌ Failed to track AI usage:', error);
    }
  }

  /**
   * Update user's AI usage statistics
   */
  private static async updateUserStats(
    userId: string,
    userEmail: string,
    feature: string,
    tokensUsed: number,
    cost: number
  ): Promise<void> {
    try {
      const statsRef = doc(db, this.STATS_COLLECTION, userId);
      const statsDoc = await getDoc(statsRef);

      const today = new Date().toISOString().split('T')[0];
      const featuresUsed = { [feature]: 1 };
      const dailyUsage = { [today]: 1 };

      if (statsDoc.exists()) {
        const currentStats = statsDoc.data();
        const currentFeatures = currentStats.featuresUsed || {};
        const currentDaily = currentStats.dailyUsage || {};

        // Update features count
        featuresUsed[feature] = (currentFeatures[feature] || 0) + 1;

        // Update daily usage
        dailyUsage[today] = (currentDaily[today] || 0) + 1;

        await updateDoc(statsRef, {
          totalRequests: increment(1),
          totalTokens: increment(tokensUsed),
          totalCost: increment(cost),
          featuresUsed: featuresUsed,
          dailyUsage: dailyUsage,
          lastUsed: new Date(),
        });
      } else {
        await setDoc(statsRef, {
          userId,
          userEmail,
          totalRequests: 1,
          totalTokens: tokensUsed,
          totalCost: cost,
          featuresUsed,
          dailyUsage,
          lastUsed: new Date(),
        });
      }
    } catch (error) {
      console.error('❌ Failed to update user stats:', error);
    }
  }

  /**
   * Get user's AI usage statistics
   */
  static async getUserStats(userId: string): Promise<AIUsageStats | null> {
    try {
      const statsRef = doc(db, this.STATS_COLLECTION, userId);
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const data = statsDoc.data();
        return {
          totalRequests: data.totalRequests || 0,
          totalTokens: data.totalTokens || 0,
          totalCost: data.totalCost || 0,
          featuresUsed: data.featuresUsed || {},
          dailyUsage: data.dailyUsage || {},
          lastUsed: data.lastUsed?.toDate() || null,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return null;
    }
  }

  /**
   * Get all AI features available in the app
   */
  static getAvailableFeatures(): AIFeature[] {
    return [
      {
        id: 'chat_suggestions',
        name: 'Chat Suggestions',
        description: 'AI-powered conversation starters and replies',
        icon: 'chatbubbles-outline',
        enabled: true,
        usageCount: 0,
      },
      {
        id: 'grammar_assistance',
        name: 'Grammar Assistant',
        description: 'Fix grammar, improve tone, and enhance writing',
        icon: 'checkmark-circle-outline',
        enabled: true,
        usageCount: 0,
      },
      {
        id: 'profile_suggestions',
        name: 'Profile Suggestions',
        description: 'AI-generated profile introduction ideas',
        icon: 'person-outline',
        enabled: true,
        usageCount: 0,
      },
      {
        id: 'content_optimization',
        name: 'Content Optimization',
        description: 'Optimize posts for better engagement',
        icon: 'trending-up-outline',
        enabled: true,
        usageCount: 0,
      },
      {
        id: 'smart_replies',
        name: 'Smart Replies',
        description: 'Context-aware reply suggestions',
        icon: 'arrow-undo-outline',
        enabled: true,
        usageCount: 0,
      },
      {
        id: 'search_suggestions',
        name: 'Search Suggestions',
        description: 'AI-powered search term suggestions',
        icon: 'search-outline',
        enabled: true,
        usageCount: 0,
      },
    ];
  }

  /**
   * Get AI usage by email (admin function)
   */
  static async getUsageByEmail(userEmail: string): Promise<AIUsageStats | null> {
    try {
      const q = query(
        collection(db, this.STATS_COLLECTION),
        orderBy('userEmail'),
        limit(1000)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.userEmail === userEmail) {
          return {
            totalRequests: data.totalRequests || 0,
            totalTokens: data.totalTokens || 0,
            totalCost: data.totalCost || 0,
            featuresUsed: data.featuresUsed || {},
            dailyUsage: data.dailyUsage || {},
            lastUsed: data.lastUsed?.toDate() || null,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get usage by email:', error);
      return null;
    }
  }

  /**
   * Get all users' AI usage (admin function)
   */
  static async getAllUsersUsage(): Promise<{ userEmail: string; stats: AIUsageStats }[]> {
    try {
      const q = query(
        collection(db, this.STATS_COLLECTION),
        orderBy('totalRequests', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const results: { userEmail: string; stats: AIUsageStats }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          userEmail: data.userEmail,
          stats: {
            totalRequests: data.totalRequests || 0,
            totalTokens: data.totalTokens || 0,
            totalCost: data.totalCost || 0,
            featuresUsed: data.featuresUsed || {},
            dailyUsage: data.dailyUsage || {},
            lastUsed: data.lastUsed?.toDate() || null,
          },
        });
      });

      return results;
    } catch (error) {
      console.error('❌ Failed to get all users usage:', error);
      return [];
    }
  }
}
