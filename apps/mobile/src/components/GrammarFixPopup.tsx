import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../config/apiConfig';

interface GrammarFixPopupProps {
  visible: boolean;
  originalText: string;
  onClose: () => void;
  onInsertText: (text: string) => void;
}

export const GrammarFixPopup: React.FC<GrammarFixPopupProps> = ({
  visible,
  originalText,
  onClose,
  onInsertText,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && originalText.trim()) {
      generateGrammarSuggestions();
    }
  }, [visible, originalText]);

  const generateGrammarSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple Gemini API endpoints
      const apiEndpoints = [
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
      ];
      
      let response;
      let lastError;
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API endpoint: ${endpoint}`);
          response = await fetch(`${endpoint}?key=${API_CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Fix the grammar and improve this text. Provide exactly 5 different corrected versions with varying styles (formal, casual, professional, friendly, concise). Each version should be on a separate line without quotes or numbering:\n\n${originalText}`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              }
            }),
          });
          
          if (response.ok) {
            console.log(`Success with endpoint: ${endpoint}`);
            break; // Success, exit the loop
          } else {
            const errorData = await response.json();
            console.log(`Failed with endpoint ${endpoint}:`, errorData);
            lastError = errorData;
          }
        } catch (error) {
          console.log(`Error with endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`All API endpoints failed. Last error: ${lastError?.error?.message || lastError?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Gemini API Response:', JSON.stringify(data, null, 2));
      
      // Check for API errors
      if (data.error) {
        console.error('Gemini API Error:', data.error);
        throw new Error(`Gemini API Error: ${data.error.message}`);
      }
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('Generated text:', generatedText);
        
        // Clean up the text and extract suggestions
        const suggestions = generatedText
          .split('\n')
          .map(line => line.trim())
          .filter(line => {
            // Filter out empty lines, quotes, and numbering
            return line.length > 0 && 
                   !line.startsWith('"') && 
                   !line.endsWith('"') &&
                   !line.match(/^\d+\./) && // Remove numbering like "1. text"
                   !line.match(/^[•-]/) && // Remove bullet points
                   line !== originalText; // Don't include the original text
          })
          .slice(0, 5); // Take first 5 suggestions
        
        console.log('Processed suggestions:', suggestions);
        
        if (suggestions.length > 0) {
          setSuggestions(suggestions);
        } else {
          // If no suggestions found, try a different approach
          const fallbackSuggestions = [
            originalText.charAt(0).toUpperCase() + originalText.slice(1) + '.',
            originalText + '.',
            'Please check your grammar and try again.',
            'Consider rephrasing this message.',
            'This message could be improved.'
          ];
          setSuggestions(fallbackSuggestions);
        }
      } else {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Error generating grammar suggestions:', error);
      setError('Failed to generate grammar suggestions. Please try again.');
      
      // Fallback suggestions
      setSuggestions([
        originalText + '.',
        originalText.charAt(0).toUpperCase() + originalText.slice(1) + '.',
        'Please check your grammar and try again.',
        'Consider rephrasing this message.',
        'This message could be improved.'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertText = (text: string) => {
    onInsertText(text);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Grammar Fix</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Original Text */}
        <View style={styles.originalTextContainer}>
          <Text style={styles.originalLabel}>Original:</Text>
          <Text style={styles.originalText}>"{originalText}"</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Fixing grammar...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={generateGrammarSuggestions}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleInsertText(suggestion)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    <View style={styles.suggestionActions}>
                      <TouchableOpacity
                        style={styles.insertButton}
                        onPress={() => handleInsertText(suggestion)}
                      >
                        <Ionicons name="arrow-down" size={16} color="white" />
                        <Text style={styles.insertButtonText}>Insert</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  originalTextContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  originalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  originalText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontStyle: 'italic',
  },
  content: {
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsContainer: {
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  suggestionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 18,
    marginRight: 12,
  },
  suggestionActions: {
    flexDirection: 'row',
  },
  insertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  insertButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default GrammarFixPopup;
