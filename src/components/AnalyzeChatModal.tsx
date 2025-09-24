import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../types';
import { AIService, ConversationSuggestion } from '../services/aiService';
import { ChatAnalysis } from '../services/firebaseAIService';

interface AnalyzeChatModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserProfile: Profile;
  otherUserProfile: Profile;
  chatHistory: any[];
  onSuggestionSelect: (suggestion: string) => void;
}

export const AnalyzeChatModal: React.FC<AnalyzeChatModalProps> = ({
  visible,
  onClose,
  currentUserProfile,
  otherUserProfile,
  chatHistory,
  onSuggestionSelect,
}) => {
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && currentUserProfile && otherUserProfile) {
      analyzeChat();
    }
  }, [visible, currentUserProfile, otherUserProfile]);

  const analyzeChat = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const aiService = AIService.getInstance();
      const chatAnalysis = await aiService.analyzeChat(
        currentUserProfile,
        otherUserProfile,
        chatHistory
      );
      
      setAnalysis(chatAnalysis);
      console.log('✅ Chat analysis completed:', chatAnalysis);
    } catch (error) {
      console.error('❌ Error analyzing chat:', error);
      setError('Failed to analyze chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: ConversationSuggestion) => {
    onSuggestionSelect(suggestion.message);
    onClose();
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'enthusiastic': return '😊';
      case 'curious': return '🤔';
      case 'excited': return '🎉';
      case 'professional': return '💼';
      case 'casual': return '😌';
      case 'grateful': return '🙏';
      case 'reserved': return '😐';
      default: return '😊';
    }
  };

  const getBehaviorEmoji = (behavior: string) => {
    switch (behavior.toLowerCase()) {
      case 'detailed': return '📝';
      case 'brief': return '⚡';
      case 'direct': return '🎯';
      case 'conversational': return '💬';
      case 'asking questions': return '❓';
      case 'sharing stories': return '📖';
      default: return '💬';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="analytics" size={24} color="#007AFF" />
              <Text style={styles.headerTitle}>Analyze Chat</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Analyzing conversation...</Text>
                <Text style={styles.loadingSubtext}>
                  Reading chat history and analyzing mood & behavior
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={analyzeChat} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : analysis ? (
              <>
                {/* Analysis Summary */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>Chat Analysis</Text>
                  <Text style={styles.analysisText}>{analysis.analysis}</Text>
                </View>

                {/* Mood & Behavior */}
                <View style={styles.insightsContainer}>
                  <View style={styles.insightItem}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightEmoji}>{getMoodEmoji(analysis.mood)}</Text>
                      <Text style={styles.insightLabel}>Mood</Text>
                    </View>
                    <Text style={styles.insightValue}>{analysis.mood}</Text>
                  </View>

                  <View style={styles.insightItem}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightEmoji}>{getBehaviorEmoji(analysis.behavior)}</Text>
                      <Text style={styles.insightLabel}>Communication Style</Text>
                    </View>
                    <Text style={styles.insightValue}>{analysis.behavior}</Text>
                  </View>

                  <View style={styles.insightItem}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightEmoji}>💬</Text>
                      <Text style={styles.insightLabel}>Style</Text>
                    </View>
                    <Text style={styles.insightValue}>{analysis.communicationStyle}</Text>
                  </View>
                </View>

                {/* Interests */}
                {analysis.interests.length > 0 && (
                  <View style={styles.interestsSection}>
                    <Text style={styles.sectionTitle}>Topics of Interest</Text>
                    <View style={styles.interestsContainer}>
                      {analysis.interests.map((interest, index) => (
                        <View key={index} style={styles.interestChip}>
                          <Text style={styles.interestText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Response Suggestions */}
                <View style={styles.suggestionsSection}>
                  <Text style={styles.sectionTitle}>Suggested Responses</Text>
                  <Text style={styles.suggestionsSubtitle}>
                    Based on {otherUserProfile.name}'s mood and communication style
                  </Text>
                  
                  {analysis.responseSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(suggestion)}
                    >
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionText}>{suggestion.message}</Text>
                        <View style={styles.suggestionMeta}>
                          <Text style={styles.suggestionContext}>{suggestion.context}</Text>
                          <View style={styles.confidenceBar}>
                            <View 
                              style={[
                                styles.confidenceFill, 
                                { width: `${suggestion.confidence * 100}%` }
                              ]} 
                            />
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#000',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  analysisSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  insightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  interestsSection: {
    marginBottom: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionContext: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  confidenceBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
});
