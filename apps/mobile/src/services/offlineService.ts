import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineService {
  private static readonly CACHE_KEYS = {
    POSTS: 'cc.cachedPosts',
    NOTIFICATIONS: 'cc.cachedNotifications',
    USERS: 'cc.cachedUsers',
    USER_PROFILE: 'cc.cachedUserProfile',
  };

  // Debug method to check CACHE_KEYS
  static debugCacheKeys() {
    console.log('🔍 CACHE_KEYS:', this.CACHE_KEYS);
    return this.CACHE_KEYS;
  }

  // Cache posts for offline viewing
  static async cachePosts(posts: any[]): Promise<void> {
    try {
      if (!posts || !Array.isArray(posts)) {
        console.warn('⚠️ Invalid posts data provided for caching');
        return;
      }

      await AsyncStorage.setItem(
        this.CACHE_KEYS.POSTS,
        JSON.stringify({
          data: posts,
          timestamp: Date.now(),
        })
      );
      console.log(`📱 Cached ${posts.length} posts for offline use`);
    } catch (error) {
      console.error('❌ Error caching posts:', error);
      throw error; // Re-throw to allow proper error handling
    }
  }

  // Get cached posts
  static async getCachedPosts(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.POSTS);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting cached posts:', error);
      return [];
    }
  }

  // Cache notifications
  static async cacheNotifications(notifications: any[]): Promise<void> {
    try {
      if (!notifications || !Array.isArray(notifications)) {
        console.warn('⚠️ Invalid notifications data provided for caching');
        return;
      }

      await AsyncStorage.setItem(
        this.CACHE_KEYS.NOTIFICATIONS,
        JSON.stringify({
          data: notifications,
          timestamp: Date.now(),
        })
      );
      console.log(`📱 Cached ${notifications.length} notifications for offline use`);
    } catch (error) {
      console.error('❌ Error caching notifications:', error);
      throw error;
    }
  }

  // Get cached notifications
  static async getCachedNotifications(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.NOTIFICATIONS);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Check if cache is not too old (6 hours)
        if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
          return data;
        }
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting cached notifications:', error);
      return [];
    }
  }

  // Cache users
  static async cacheUsers(users: any[]): Promise<void> {
    try {
      if (!users || !Array.isArray(users)) {
        console.warn('⚠️ Invalid users data provided for caching');
        return;
      }

      await AsyncStorage.setItem(
        this.CACHE_KEYS.USERS,
        JSON.stringify({
          data: users,
          timestamp: Date.now(),
        })
      );
      console.log(`📱 Cached ${users.length} users for offline use`);
    } catch (error) {
      console.error('❌ Error caching users:', error);
      throw error;
    }
  }

  // Get cached users
  static async getCachedUsers(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USERS);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Check if cache is not too old (12 hours)
        if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
          return data;
        }
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting cached users:', error);
      return [];
    }
  }

  // Cache user profile
  static async cacheUserProfile(profile: any): Promise<void> {
    try {
      if (!profile || typeof profile !== 'object') {
        console.warn('⚠️ Invalid profile data provided for caching');
        return;
      }

      await AsyncStorage.setItem(
        this.CACHE_KEYS.USER_PROFILE,
        JSON.stringify({
          data: profile,
          timestamp: Date.now(),
        })
      );
      console.log('📱 Cached user profile for offline use');
    } catch (error) {
      console.error('❌ Error caching user profile:', error);
      throw error;
    }
  }

  // Get cached user profile
  static async getCachedUserProfile(): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached user profile:', error);
      return null;
    }
  }

  // Clear all cached data
  static async clearAllCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.CACHE_KEYS.POSTS),
        AsyncStorage.removeItem(this.CACHE_KEYS.NOTIFICATIONS),
        AsyncStorage.removeItem(this.CACHE_KEYS.USERS),
        AsyncStorage.removeItem(this.CACHE_KEYS.USER_PROFILE),
      ]);
      console.log('📱 Cleared all offline cache');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Get cache size info
  static async getCacheInfo(): Promise<{ [key: string]: { size: number; timestamp: number } }> {
    try {
      const info: { [key: string]: { size: number; timestamp: number } } = {};
      
      for (const [key, storageKey] of Object.entries(this.CACHE_KEYS)) {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          info[key] = {
            size: Array.isArray(data) ? data.length : 1,
            timestamp,
          };
        }
      }
      
      return info;
    } catch (error) {
      console.error('❌ Error getting cache info:', error);
      return {};
    }
  }
}
