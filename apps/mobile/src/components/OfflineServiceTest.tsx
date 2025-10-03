import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { OfflineService } from '../services/offlineService';

const OfflineServiceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCacheKeys = () => {
    try {
      const keys = OfflineService.debugCacheKeys();
      addResult(`✅ CACHE_KEYS loaded: ${JSON.stringify(keys)}`);
    } catch (error) {
      addResult(`❌ Error loading CACHE_KEYS: ${error}`);
    }
  };

  const testCachePosts = async () => {
    try {
      const samplePosts = [
        { id: '1', content: 'Test post 1', userId: 'test-user' },
        { id: '2', content: 'Test post 2', userId: 'test-user' },
      ];
      
      await OfflineService.cachePosts(samplePosts);
      addResult(`✅ Successfully cached ${samplePosts.length} posts`);
    } catch (error) {
      addResult(`❌ Error caching posts: ${error}`);
    }
  };

  const testGetCachedPosts = async () => {
    try {
      const cachedPosts = await OfflineService.getCachedPosts();
      addResult(`✅ Retrieved ${cachedPosts.length} cached posts`);
    } catch (error) {
      addResult(`❌ Error getting cached posts: ${error}`);
    }
  };

  const testCacheNotifications = async () => {
    try {
      const sampleNotifications = [
        { id: '1', message: 'Test notification 1', type: 'like' },
        { id: '2', message: 'Test notification 2', type: 'comment' },
      ];
      
      await OfflineService.cacheNotifications(sampleNotifications);
      addResult(`✅ Successfully cached ${sampleNotifications.length} notifications`);
    } catch (error) {
      addResult(`❌ Error caching notifications: ${error}`);
    }
  };

  const testGetCacheInfo = async () => {
    try {
      const info = await OfflineService.getCacheInfo();
      addResult(`✅ Cache info: ${JSON.stringify(info)}`);
    } catch (error) {
      addResult(`❌ Error getting cache info: ${error}`);
    }
  };

  const clearAllTests = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OfflineService Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testCacheKeys}>
          <Text style={styles.buttonText}>Test Cache Keys</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testCachePosts}>
          <Text style={styles.buttonText}>Test Cache Posts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testGetCachedPosts}>
          <Text style={styles.buttonText}>Test Get Cached Posts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testCacheNotifications}>
          <Text style={styles.buttonText}>Test Cache Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testGetCacheInfo}>
          <Text style={styles.buttonText}>Test Cache Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearAllTests}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
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
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
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
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default OfflineServiceTest;
