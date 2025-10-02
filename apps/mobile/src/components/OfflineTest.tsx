import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';
import { OfflineService } from '../services/offlineService';

const OfflineTest: React.FC = () => {
  const { isOffline, isConnected, isInternetReachable, connectionType } = useNetwork();

  const testCache = async () => {
    try {
      // Test caching some sample data
      const samplePosts = [
        { id: '1', content: 'Test post 1', userId: 'test-user' },
        { id: '2', content: 'Test post 2', userId: 'test-user' },
      ];
      
      await OfflineService.cachePosts(samplePosts);
      
      const cachedPosts = await OfflineService.getCachedPosts();
      Alert.alert('Cache Test', `Cached ${cachedPosts.length} posts successfully!`);
    } catch (error) {
      Alert.alert('Cache Test Error', `Failed to test cache: ${error}`);
    }
  };

  const clearCache = async () => {
    try {
      await OfflineService.clearAllCache();
      Alert.alert('Cache Cleared', 'All cached data has been cleared!');
    } catch (error) {
      Alert.alert('Clear Cache Error', `Failed to clear cache: ${error}`);
    }
  };

  const getCacheInfo = async () => {
    try {
      const info = await OfflineService.getCacheInfo();
      const infoText = Object.entries(info)
        .map(([key, value]) => `${key}: ${value.size} items`)
        .join('\n');
      Alert.alert('Cache Info', infoText || 'No cached data found');
    } catch (error) {
      Alert.alert('Cache Info Error', `Failed to get cache info: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Test Panel</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Network Status:</Text>
        <Text style={[styles.statusValue, { color: isConnected ? 'green' : 'red' }]}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        <Text style={styles.statusText}>Internet Reachable:</Text>
        <Text style={[styles.statusValue, { color: isInternetReachable ? 'green' : 'red' }]}>
          {isInternetReachable === null ? 'Unknown' : isInternetReachable ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>Connection Type:</Text>
        <Text style={styles.statusValue}>{connectionType || 'Unknown'}</Text>
        <Text style={styles.statusText}>Offline Mode:</Text>
        <Text style={[styles.statusValue, { color: isOffline ? 'red' : 'green' }]}>
          {isOffline ? 'Yes' : 'No'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testCache}>
          <Text style={styles.buttonText}>Test Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={getCacheInfo}>
          <Text style={styles.buttonText}>Get Cache Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearCache}>
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  statusValue: {
    fontSize: 14,
    marginLeft: 10,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OfflineTest;
