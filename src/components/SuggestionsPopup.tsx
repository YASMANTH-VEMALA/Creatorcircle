import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationSuggestionService, ConversationSuggestion } from '../services/conversationSuggestionService';
import { Profile } from '../types';

interface SuggestionsPopupProps {
  visible: boolean;
  onClose: () => void;
  onSuggestionSelect: (suggestion: string) => void;
  currentUserProfile: Profile | null;
  otherUserProfile: Profile | null;
}

export const SuggestionsPopup: React.FC<SuggestionsPopupProps> = ({
  visible,
  onClose,
  onSuggestionSelect,
  currentUserProfile,
  otherUserProfile,
}) => {
  const [suggestions, setSuggestions] = useState<ConversationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      generateSuggestions();
    }
  }, [visible]);

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating personalized conversation suggestions...');
      const personalizedSuggestions = await ConversationSuggestionService.generateConversationSuggestions(
        currentUserProfile,
        otherUserProfile
      );
      
      console.log('Generated suggestions:', personalizedSuggestions);
      setSuggestions(personalizedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Failed to generate suggestions. Please try again.');
      
      // Fallback suggestions
      const fallbackSuggestions: ConversationSuggestion[] = [
        {
          suggestion: "Hey! How's your day going?",
          reason: "General conversation starter",
          category: "icebreaker"
        },
        {
          suggestion: "What's the most interesting project you're working on?",
          reason: "Professional conversation starter",
          category: "professional"
        },
        {
          suggestion: "I'd love to hear about your recent work!",
          reason: "Shows interest in their work",
          category: "professional"
        },
        {
          suggestion: "What's something you're passionate about?",
          reason: "Personal conversation starter",
          category: "personal"
        }
      ];
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Conversation Suggestions</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Analyzing profiles and generating personalized suggestions...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={generateSuggestions}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsHeader}>
                Personalized conversation starters based on your profiles
              </Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(suggestion.suggestion)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionContent}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionText}>{suggestion.suggestion}</Text>
                      <View style={[styles.categoryTag, styles[`category_${suggestion.category}`]]}>
                        <Text style={styles.categoryText}>{suggestion.category.replace('_', ' ')}</Text>
                      </View>
                    </View>
                    <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#007AFF" />
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
    borderRadius: 16,
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    maxHeight: 400,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsContainer: {
    padding: 20,
  },
  suggestionsHeader: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 20,
    marginRight: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  category_personal: {
    backgroundColor: '#E3F2FD',
  },
  category_professional: {
    backgroundColor: '#E8F5E8',
  },
  category_shared_interest: {
    backgroundColor: '#FFF3E0',
  },
  category_icebreaker: {
    backgroundColor: '#F3E5F5',
  },
  suggestionReason: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default SuggestionsPopup;
