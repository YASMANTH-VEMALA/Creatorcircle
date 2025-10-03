import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { OfflineService } from '../services/offlineService';

export const useOfflineData = <T>(
  dataKey: 'posts' | 'notifications' | 'users' | 'userProfile',
  fetchFunction: () => Promise<T[]>,
  cacheFunction: (data: T[]) => Promise<void>
) => {
  const { isOffline } = useNetwork();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCachedData = useCallback(async () => {
    try {
      let cachedData: T[] = [];
      
      switch (dataKey) {
        case 'posts':
          cachedData = await OfflineService.getCachedPosts() as T[];
          break;
        case 'notifications':
          cachedData = await OfflineService.getCachedNotifications() as T[];
          break;
        case 'users':
          cachedData = await OfflineService.getCachedUsers() as T[];
          break;
        case 'userProfile':
          const profile = await OfflineService.getCachedUserProfile();
          cachedData = profile ? [profile] : [];
          break;
      }
      
      setData(cachedData);
      console.log(`📱 Loaded ${cachedData.length} cached ${dataKey}`);
    } catch (error) {
      console.error(`❌ Error loading cached ${dataKey}:`, error);
      setError('Failed to load cached data');
    }
  }, [dataKey]);

  const loadFreshData = useCallback(async () => {
    if (isOffline) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const freshData = await fetchFunction();
      setData(freshData);
      
      // Cache the fresh data
      await cacheFunction(freshData);
      
      console.log(`📱 Loaded ${freshData.length} fresh ${dataKey}`);
    } catch (error) {
      console.error(`❌ Error loading fresh ${dataKey}:`, error);
      setError('Failed to load data');
      
      // Fallback to cached data on error
      await loadCachedData();
    } finally {
      setLoading(false);
    }
  }, [isOffline, fetchFunction, cacheFunction, loadCachedData, dataKey]);

  const refreshData = useCallback(async () => {
    if (isOffline) {
      await loadCachedData();
    } else {
      await loadFreshData();
    }
  }, [isOffline, loadCachedData, loadFreshData]);

  useEffect(() => {
    const initializeData = async () => {
      if (isOffline) {
        // If offline, load cached data immediately
        await loadCachedData();
        setLoading(false);
      } else {
        // If online, try to load fresh data
        await loadFreshData();
      }
    };

    initializeData();
  }, [isOffline, loadCachedData, loadFreshData]);

  return {
    data,
    loading,
    error,
    refreshData,
    isOffline,
  };
};
