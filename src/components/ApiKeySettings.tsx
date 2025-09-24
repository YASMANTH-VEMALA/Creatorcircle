import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ACTIVE_PROVIDER } from '../config/apiConfig';

interface ApiKeySettingsProps {
  onApiKeyUpdate?: (hasValidKey: boolean) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeyUpdate }) => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const storedOpenaiKey = await AsyncStorage.getItem('openai_api_key');
      const storedGeminiKey = await AsyncStorage.getItem('gemini_api_key');
      const storedEnabled = await AsyncStorage.getItem('ai_enabled');
      
      setOpenaiKey(storedOpenaiKey || '');
      setGeminiKey(storedGeminiKey || '');
      setIsEnabled(storedEnabled === 'true');
      
      // Check if we have a valid key for the active provider
      const hasValidKey = ACTIVE_PROVIDER === 'openai' 
        ? !!storedOpenaiKey && storedOpenaiKey !== 'YOUR_OPENAI_API_KEY_HERE'
        : !!storedGeminiKey && storedGeminiKey !== 'YOUR_GEMINI_API_KEY_HERE';
      
      onApiKeyUpdate?.(hasValidKey);
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const saveApiKeys = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('openai_api_key', openaiKey);
      await AsyncStorage.setItem('gemini_api_key', geminiKey);
      await AsyncStorage.setItem('ai_enabled', isEnabled.toString());
      
      // Check if we have a valid key for the active provider
      const hasValidKey = ACTIVE_PROVIDER === 'openai' 
        ? !!openaiKey && openaiKey !== 'YOUR_OPENAI_API_KEY_HERE'
        : !!geminiKey && geminiKey !== 'YOUR_GEMINI_API_KEY_HERE';
      
      onApiKeyUpdate?.(hasValidKey);
      
      Alert.alert('Success', 'API keys saved successfully!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      Alert.alert('Error', 'Failed to save API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiKey = async () => {
    if (!openaiKey && !geminiKey) {
      Alert.alert('No API Key', 'Please enter an API key first');
      return;
    }

    setIsLoading(true);
    try {
      // Test the active provider's API key
      const testKey = ACTIVE_PROVIDER === 'openai' ? openaiKey : geminiKey;
      
      if (ACTIVE_PROVIDER === 'openai') {
        const response = await fetch(`${API_CONFIG.OPENAI_BASE_URL}/models`, {
          headers: {
            'Authorization': `Bearer ${testKey}`,
          },
        });
        
        if (response.ok) {
          Alert.alert('Success', 'OpenAI API key is valid!');
        } else {
          Alert.alert('Error', 'Invalid OpenAI API key');
        }
      } else {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
        
        if (response.ok) {
          Alert.alert('Success', 'Gemini API key is valid!');
        } else {
          Alert.alert('Error', 'Invalid Gemini API key');
        }
      }
    } catch (error) {
      console.error('API key test error:', error);
      Alert.alert('Error', 'Failed to test API key');
    } finally {
      setIsLoading(false);
    }
  };

  const clearApiKeys = () => {
    Alert.alert(
      'Clear API Keys',
      'Are you sure you want to clear all API keys?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setOpenaiKey('');
            setGeminiKey('');
            setIsEnabled(false);
            await AsyncStorage.multiRemove(['openai_api_key', 'gemini_api_key', 'ai_enabled']);
            onApiKeyUpdate?.(false);
            Alert.alert('Success', 'API keys cleared');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI API Configuration</Text>
      <Text style={styles.subtitle}>
        Configure your API keys for better AI responses
      </Text>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Enable AI Features</Text>
        <Switch
          value={isEnabled}
          onValueChange={setIsEnabled}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>OpenAI API Key</Text>
        <TextInput
          style={styles.input}
          value={openaiKey}
          onChangeText={setOpenaiKey}
          placeholder="sk-..."
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helpText}>
          Get your API key from: https://platform.openai.com/api-keys
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Google Gemini API Key</Text>
        <TextInput
          style={styles.input}
          value={geminiKey}
          onChangeText={setGeminiKey}
          placeholder="AI..."
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helpText}>
          Get your API key from: https://makersuite.google.com/app/apikey
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testApiKey}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test API Key</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveApiKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Save Keys</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearApiKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.currentProvider}>
        Current Provider: {ACTIVE_PROVIDER.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  currentProvider: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
