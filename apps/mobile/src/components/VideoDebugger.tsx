import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { VideoErrorHandler } from '../utils/videoErrorHandler';

interface VideoDebuggerProps {
  videoUrl: string;
  onClose: () => void;
}

export const VideoDebugger: React.FC<VideoDebuggerProps> = ({ videoUrl, onClose }) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runVideoTests = async () => {
    setIsLoading(true);
    try {
      // Test URL validity
      const isValidUrl = VideoErrorHandler.testVideoUrl(videoUrl);
      
      // Test URL accessibility
      const isAccessible = await VideoErrorHandler.testVideoUrl(videoUrl);
      
      // Get video info
      const videoInfo = {
        url: videoUrl,
        isValidUrl: await isValidUrl,
        isAccessible: await isAccessible,
        timestamp: new Date().toISOString(),
        platform: 'React Native',
      };
      
      setTestResults(videoInfo);
    } catch (error) {
      console.error('Video debug test failed:', error);
      Alert.alert('Debug Error', 'Failed to run video tests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runVideoTests();
  }, [videoUrl]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Debugger</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Video URL</Text>
        <Text style={styles.urlText} numberOfLines={3}>
          {videoUrl}
        </Text>
        
        <Text style={styles.sectionTitle}>Test Results</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Running tests...</Text>
        ) : testResults ? (
          <View style={styles.resultsContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>URL Valid:</Text>
              <Text style={[styles.resultValue, testResults.isValidUrl ? styles.success : styles.error]}>
                {testResults.isValidUrl ? '✓ Yes' : '✗ No'}
              </Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>URL Accessible:</Text>
              <Text style={[styles.resultValue, testResults.isAccessible ? styles.success : styles.error]}>
                {testResults.isAccessible ? '✓ Yes' : '✗ No'}
              </Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Platform:</Text>
              <Text style={styles.resultValue}>{testResults.platform}</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Test Time:</Text>
              <Text style={styles.resultValue}>{testResults.timestamp}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>Failed to run tests</Text>
        )}
        
        <Text style={styles.sectionTitle}>Common Issues</Text>
        <View style={styles.issuesContainer}>
          <Text style={styles.issueText}>• Check if video URL is valid and accessible</Text>
          <Text style={styles.issueText}>• Ensure video format is supported (MP4, MOV, etc.)</Text>
          <Text style={styles.issueText}>• Verify internet connection for remote videos</Text>
          <Text style={styles.issueText}>• Check if video file exists and has proper permissions</Text>
          <Text style={styles.issueText}>• Ensure video is not corrupted</Text>
        </View>
        
        <TouchableOpacity onPress={runVideoTests} style={styles.retryButton}>
          <Text style={styles.retryText}>Run Tests Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#ccc',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  loadingText: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  resultsContainer: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  issuesContainer: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
  },
  issueText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
