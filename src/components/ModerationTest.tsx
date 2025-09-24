import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { ContentModerationService } from '../services/contentModerationService';

const ModerationTest: React.FC = () => {
  const [testText, setTestText] = useState('');
  const [result, setResult] = useState<any>(null);

  const testModeration = async () => {
    try {
      console.log('🧪 Testing moderation with text:', testText);
      const moderationResult = await ContentModerationService.moderatePost(testText, [], []);
      
      setResult(moderationResult);
      
      if (moderationResult.isAppropriate) {
        Alert.alert('✅ APPROVED', 'Content is appropriate');
      } else {
        Alert.alert('❌ BLOCKED', `Content blocked: ${moderationResult.reasons.join(', ')}`);
      }
      
      console.log('Moderation result:', moderationResult);
    } catch (error) {
      console.error('Moderation test error:', error);
      Alert.alert('Error', 'Failed to test moderation');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Content Moderation Test</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter text to test moderation..."
        value={testText}
        onChangeText={setTestText}
        multiline
      />
      
      <TouchableOpacity style={styles.button} onPress={testModeration}>
        <Text style={styles.buttonText}>Test Moderation</Text>
      </TouchableOpacity>
      
      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>
            Status: {result.isAppropriate ? '✅ APPROVED' : '❌ BLOCKED'}
          </Text>
          <Text style={styles.resultText}>
            Reasons: {result.reasons.join(', ')}
          </Text>
          <Text style={styles.resultText}>
            Flagged Words: {result.textResult.flaggedWords.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default ModerationTest;
