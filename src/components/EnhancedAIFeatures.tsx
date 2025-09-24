import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../services/aiService';

interface EnhancedAIFeaturesProps {
  currentUserProfile: any;
  otherUserProfile?: any;
  chatHistory?: any[];
  onSuggestionSelect?: (suggestion: string) => void;
  visible?: boolean;
  onClose?: () => void;
}

const EnhancedAIFeatures: React.FC<EnhancedAIFeaturesProps> = ({
  currentUserProfile,
  otherUserProfile,
  chatHistory = [],
  onSuggestionSelect,
  visible = false,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversation' | 'research' | 'content' | 'analysis'>('conversation');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [researchTopic, setResearchTopic] = useState('');
  const [researchResult, setResearchResult] = useState('');
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [chatAnalysis, setChatAnalysis] = useState<any>(null);
  const [aiProviders, setAiProviders] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadAIProviders();
    }
  }, [visible]);

  const loadAIProviders = async () => {
    try {
      const providers = aiService.getAvailableProviders();
      setAiProviders(providers);
      console.log('🤖 Available AI providers:', providers);
    } catch (error) {
      console.error('Error loading AI providers:', error);
    }
  };

  const generateConversationStarters = async () => {
    if (!otherUserProfile) {
      Alert.alert('Error', 'Other user profile is required for conversation starters');
      return;
    }

    setLoading(true);
    try {
      const suggestions = await aiService.generateConversationStarters(
        currentUserProfile,
        otherUserProfile,
        chatHistory
      );
      setSuggestions(suggestions.map(s => s.message));
    } catch (error) {
      console.error('Error generating conversation starters:', error);
      Alert.alert('Error', 'Failed to generate conversation starters');
    } finally {
      setLoading(false);
    }
  };

  const researchTopic = async () => {
    if (!researchTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic to research');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.generateResearchInsights(researchTopic);
      setResearchResult(result);
    } catch (error) {
      console.error('Error researching topic:', error);
      Alert.alert('Error', 'Failed to research topic');
    } finally {
      setLoading(false);
    }
  };

  const generateContentIdeas = async () => {
    setLoading(true);
    try {
      const ideas = await aiService.generateContentIdeas(
        currentUserProfile.skills || [],
        currentUserProfile.interests || [],
        'post'
      );
      setContentIdeas(ideas);
    } catch (error) {
      console.error('Error generating content ideas:', error);
      Alert.alert('Error', 'Failed to generate content ideas');
    } finally {
      setLoading(false);
    }
  };

  const analyzeChat = async () => {
    if (chatHistory.length === 0) {
      Alert.alert('Info', 'No chat history to analyze');
      return;
    }

    setLoading(true);
    try {
      const analysis = await aiService.analyzeChatConversation(chatHistory);
      setChatAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing chat:', error);
      Alert.alert('Error', 'Failed to analyze chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'conversation':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Conversation Starters</Text>
            <Text style={styles.tabDescription}>
              AI-powered conversation starters based on your profiles and interests
            </Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={generateConversationStarters}
              disabled={loading || !otherUserProfile}
            >
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {loading ? 'Generating...' : 'Generate Starters'}
              </Text>
            </TouchableOpacity>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      case 'research':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Research & Insights</Text>
            <Text style={styles.tabDescription}>
              Get real-time information and insights on any topic using Perplexity AI
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter a topic to research..."
                placeholderTextColor="#999"
                value={researchTopic}
                onChangeText={setResearchTopic}
                multiline
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={researchTopic}
                disabled={loading || !researchTopic.trim()}
              >
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  {loading ? 'Researching...' : 'Research'}
                </Text>
              </TouchableOpacity>
            </View>

            {researchResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Research Results:</Text>
                <Text style={styles.resultText}>{researchResult}</Text>
              </View>
            )}
          </View>
        );

      case 'content':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Content Ideas</Text>
            <Text style={styles.tabDescription}>
              Generate creative content ideas based on your skills and interests
            </Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={generateContentIdeas}
              disabled={loading}
            >
              <Ionicons name="bulb" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {loading ? 'Generating...' : 'Generate Ideas'}
              </Text>
            </TouchableOpacity>

            {contentIdeas.length > 0 && (
              <View style={styles.ideasContainer}>
                <Text style={styles.ideasTitle}>Content Ideas:</Text>
                {contentIdeas.map((idea, index) => (
                  <View key={index} style={styles.ideaItem}>
                    <Text style={styles.ideaText}>{idea}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'analysis':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Chat Analysis</Text>
            <Text style={styles.tabDescription}>
              Analyze your conversation and get suggestions for improvement
            </Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={analyzeChat}
              disabled={loading || chatHistory.length === 0}
            >
              <Ionicons name="analytics" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {loading ? 'Analyzing...' : 'Analyze Chat'}
              </Text>
            </TouchableOpacity>

            {chatAnalysis && (
              <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>Analysis:</Text>
                <Text style={styles.analysisText}>{chatAnalysis.analysis}</Text>
                
                <Text style={styles.analysisTitle}>Suggestions:</Text>
                {chatAnalysis.suggestions.map((suggestion: string, index: number) => (
                  <Text key={index} style={styles.analysisSuggestion}>
                    • {suggestion}
                  </Text>
                ))}
                
                <Text style={styles.analysisTitle}>Tone: {chatAnalysis.tone}</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Enhanced AI Features</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {aiProviders && (
            <View style={styles.providersContainer}>
              <Text style={styles.providersTitle}>AI Providers:</Text>
              <View style={styles.providersList}>
                <View style={[styles.providerItem, aiProviders.gemini && styles.providerActive]}>
                  <Ionicons name="logo-google" size={16} color={aiProviders.gemini ? "#4CAF50" : "#999"} />
                  <Text style={[styles.providerText, aiProviders.gemini && styles.providerTextActive]}>
                    Gemini {aiProviders.active === 'gemini' && '(Active)'}
                  </Text>
                </View>
                <View style={[styles.providerItem, aiProviders.perplexity && styles.providerActive]}>
                  <Ionicons name="search" size={16} color={aiProviders.perplexity ? "#4CAF50" : "#999"} />
                  <Text style={[styles.providerText, aiProviders.perplexity && styles.providerTextActive]}>
                    Perplexity {aiProviders.active === 'perplexity' && '(Active)'}
                  </Text>
                </View>
                <View style={[styles.providerItem, aiProviders.firebase && styles.providerActive]}>
                  <Ionicons name="flame" size={16} color={aiProviders.firebase ? "#4CAF50" : "#999"} />
                  <Text style={[styles.providerText, aiProviders.firebase && styles.providerTextActive]}>
                    Firebase {aiProviders.active === 'firebase' && '(Active)'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'conversation', label: 'Conversation', icon: 'chatbubbles' },
                { key: 'research', label: 'Research', icon: 'search' },
                { key: 'content', label: 'Content', icon: 'bulb' },
                { key: 'analysis', label: 'Analysis', icon: 'analytics' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={16} 
                    color={activeTab === tab.key ? '#007AFF' : '#666'} 
                  />
                  <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.content}>
            {renderTabContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  providersContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  providersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  providersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  providerActive: {
    backgroundColor: '#e8f5e8',
  },
  providerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  providerTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tabDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  resultContainer: {
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ideasContainer: {
    marginTop: 10,
  },
  ideasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  ideaItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  ideaText: {
    fontSize: 14,
    color: '#333',
  },
  analysisContainer: {
    marginTop: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  analysisSuggestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default EnhancedAIFeatures;
