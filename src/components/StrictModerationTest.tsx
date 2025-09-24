import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StrictContentModeration } from '../services/strictContentModeration';

const StrictModerationTest: React.FC = () => {
  const [testText, setTestText] = useState('');
  const [result, setResult] = useState<any>(null);

  const testModeration = async () => {
    try {
      console.log('🧪 Testing strict moderation with text:', testText);
      const moderationResult = StrictContentModeration.analyzePost(testText, [], []);
      
      setResult(moderationResult);
      
      if (moderationResult.isAppropriate) {
        Alert.alert('✅ APPROVED', 'Content is appropriate');
      } else {
        Alert.alert('❌ BLOCKED', `Content blocked: ${moderationResult.reasons.join(', ')}`);
      }
      
      console.log('Strict moderation result:', moderationResult);
    } catch (error) {
      console.error('Moderation test error:', error);
      Alert.alert('Error', 'Failed to test moderation');
    }
  };

  const testSexualContent = () => {
    setTestText('Check out this sexy photo of me');
  };

  const testExplicitContent = () => {
    setTestText('Fuck this assignment, I hate it so much');
  };

  const testNudeContent = () => {
    setTestText('Want to see my nude pics?');
  };

  const testRoughSexContent = () => {
    setTestText('Rough sex with stepbrother');
  };

  const testCleanContent = () => {
    setTestText('Hello everyone! How are you doing today?');
  };

  const testViolenceContent = () => {
    setTestText('I want to kill this person');
  };

  const testHateContent = () => {
    setTestText('I hate all gay people');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🤖 AI-Powered Content Moderation Test</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter text to test AI moderation..."
        value={testText}
        onChangeText={setTestText}
        multiline
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testModeration}>
          <Text style={styles.buttonText}>Test AI Moderation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testCleanContent}>
          <Text style={styles.buttonText}>Test Clean Content</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sexualButton} onPress={testSexualContent}>
          <Text style={styles.buttonText}>Test Sexual Content</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sexualButton} onPress={testNudeContent}>
          <Text style={styles.buttonText}>Test Nude Content</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sexualButton} onPress={testRoughSexContent}>
          <Text style={styles.buttonText}>Test Rough Sex Content</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.explicitButton} onPress={testExplicitContent}>
          <Text style={styles.buttonText}>Test Explicit Content</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.violenceButton} onPress={testViolenceContent}>
          <Text style={styles.buttonText}>Test Violence Content</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.hateButton} onPress={testHateContent}>
          <Text style={styles.buttonText}>Test Hate Speech</Text>
        </TouchableOpacity>
      </View>
      
      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>🤖 AI Analysis Results:</Text>
          <Text style={styles.resultText}>
            Status: {result.isAppropriate ? '✅ APPROVED' : '❌ BLOCKED'}
          </Text>
          <Text style={styles.resultText}>
            Category: {result.category.toUpperCase()}
          </Text>
          <Text style={styles.resultText}>
            Confidence: {Math.round(result.confidence * 100)}%
          </Text>
          <Text style={styles.resultText}>
            Reasons: {result.reasons.join(', ')}
          </Text>
          <Text style={styles.resultText}>
            Flagged Words: {result.flaggedWords.join(', ')}
          </Text>
        </View>
      )}
    </ScrollView>
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
    color: '#333',
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
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  sexualButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  explicitButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  violenceButton: {
    backgroundColor: '#8E8E93',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  hateButton: {
    backgroundColor: '#5856D6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
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
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});

export default StrictModerationTest;
