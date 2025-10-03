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
import { API_CONFIG } from '../config/apiConfig';

interface AnalysisPopupProps {
  visible: boolean;
  onClose: () => void;
  chatHistory: any[];
  onSuggestionSelect?: (suggestion: string) => void;
}

interface ChatAnalysis {
  mood: string;
  tone: string;
  messageCount: number;
  keyTopics: string[];
  conversationFlow: string;
  suggestions: string[];
  summary: string;
  nextSteps: string[];
}

export const AnalysisPopup: React.FC<AnalysisPopupProps> = ({
  visible,
  onClose,
  chatHistory,
  onSuggestionSelect,
}) => {
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && chatHistory.length > 0) {
      generateAnalysis();
    }
  }, [visible, chatHistory]);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Analyzing chat conversation...');
      
      // Prepare conversation data for AI analysis
      const conversationText = chatHistory
        .map((message, index) => {
          const sender = message.senderId === 'current' ? 'You' : 'Other User';
          const timestamp = new Date(message.timestamp).toLocaleTimeString();
          return `${sender} (${timestamp}): ${message.text}`;
        })
        .join('\n');

      console.log('Conversation text:', conversationText);

      // Call Gemini API for analysis
      const analysis = await callGeminiAnalysisAPI(conversationText, chatHistory.length);
      setAnalysis(analysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
      setError('Failed to analyze conversation. Please try again.');
      
      // Fallback analysis
      setAnalysis(generateFallbackAnalysis());
    } finally {
      setLoading(false);
    }
  };

  const callGeminiAnalysisAPI = async (conversationText: string, messageCount: number): Promise<ChatAnalysis> => {
    const prompt = `Analyze this chat conversation between two users and provide detailed insights. 

CONVERSATION:
${conversationText}

Please analyze and provide a JSON response with the following structure:
{
  "mood": "Overall mood of the conversation (e.g., Friendly, Professional, Casual, Enthusiastic, etc.)",
  "tone": "Communication tone (e.g., Conversational, Formal, Playful, Supportive, etc.)",
  "messageCount": ${messageCount},
  "keyTopics": ["List of main topics discussed", "up to 5 topics"],
  "conversationFlow": "Brief description of how the conversation has progressed and the current state",
  "suggestions": ["Direct messages ready to send", "Natural responses to continue the conversation", "Written from your perspective using 'I' not names", "up to 6 clean message suggestions"],
  "summary": "A comprehensive summary of the conversation, highlighting key points, interests, and relationship dynamics",
  "nextSteps": ["Direct messages you can send", "to deepen the conversation", "or strengthen the relationship", "up to 4 clean message suggestions"]
}

Focus on:
1. What topics are they both interested in?
2. What's the current energy/engagement level?
3. What natural conversation paths could continue from here?
4. What would make this conversation more meaningful?
5. What questions would spark deeper discussion?

IMPORTANT: All suggestions must be:
- Direct messages ready to send (no "You could say..." or names)
- Written from the user's perspective using "I" and "my"
- Natural and conversational
- Clean text without extra formatting

Make the suggestions specific, engaging, and tailored to their actual conversation.`;

    const apiEndpoints = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
    ];

    let response;
    let lastError;

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Trying Gemini API endpoint: ${endpoint}`);
        response = await fetch(`${endpoint}?key=${API_CONFIG.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          }),
        });

        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          break;
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
      throw new Error(`All Gemini API endpoints failed. Last error: ${lastError?.error?.message || lastError?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Generated analysis:', generatedText);

      try {
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return analysis;
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } else {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }
  };

  const generateFallbackAnalysis = (): ChatAnalysis => {
    return {
      mood: 'Friendly',
      tone: 'Conversational',
      messageCount: chatHistory.length,
      keyTopics: ['General Chat', 'Getting to Know Each Other'],
      conversationFlow: 'The conversation is in early stages with friendly exchanges.',
      suggestions: [
        'What are some of your favorite hobbies or interests?',
        'I had an interesting day today - how was yours?',
        'What kind of projects are you working on lately?',
        'I\'d love to know more about what you\'re passionate about',
        'What\'s your take on this? I\'m curious about your perspective',
        'I had this cool experience recently that I thought you might find interesting'
      ],
      summary: 'This is a developing conversation with potential for deeper connection. Both participants seem engaged and open to continuing the discussion.',
      nextSteps: [
        'I think we should explore what we both enjoy doing',
        'I\'d like to ask you some more personal questions to get to know you better',
        'I have some interesting stories I could share with you',
        'I hope we can continue this conversation soon'
      ]
    };
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
          <Text style={styles.title}>Chat Analysis</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Analyzing conversation...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : analysis ? (
            <View style={styles.analysisContainer}>
              {/* Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Text style={styles.sectionText}>{analysis.summary}</Text>
              </View>

              {/* Stats */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conversation Stats</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{analysis.messageCount}</Text>
                    <Text style={styles.statLabel}>Messages</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{analysis.mood}</Text>
                    <Text style={styles.statLabel}>Mood</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{analysis.tone}</Text>
                    <Text style={styles.statLabel}>Tone</Text>
                  </View>
                </View>
              </View>

              {/* Key Topics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Topics</Text>
                <View style={styles.topicsContainer}>
                  {analysis.keyTopics.map((topic: string, index: number) => (
                    <View key={index} style={styles.topicTag}>
                      <Text style={styles.topicText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Conversation Flow */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conversation Flow</Text>
                <Text style={styles.sectionText}>{analysis.conversationFlow}</Text>
              </View>

              {/* AI Suggestions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Conversation Suggestions</Text>
                {analysis.suggestions.map((suggestion: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      if (onSuggestionSelect) {
                        onSuggestionSelect(suggestion);
                        onClose();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bulb-outline" size={16} color="#FF9500" />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    {onSuggestionSelect && (
                      <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Next Steps */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Next Steps</Text>
                {analysis.nextSteps.map((step: string, index: number) => (
                  <View key={index} style={styles.nextStepItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
                    <Text style={styles.nextStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No conversation to analyze</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation to get AI analysis
              </Text>
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
    maxHeight: 500,
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
  },
  analysisContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    lineHeight: 18,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
  },
  nextStepText: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
    marginLeft: 8,
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default AnalysisPopup;
