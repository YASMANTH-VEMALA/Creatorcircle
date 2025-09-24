import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
  Linking,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import NewChatService, { ChatMessage, ChatUser, ChatTheme } from '../services/newChatService';
import { AIService } from '../services/aiService';
import { UserService } from '../services/userService';
import { Profile } from '../types';
import { Avatar } from '../components/ui/Avatar';
import AIButton from '../components/AIButton';
import GrammarFixPopup from '../components/GrammarFixPopup';
import AIMainPopup from '../components/AIMainPopup';
import SuggestionsPopup from '../components/SuggestionsPopup';
import AnalysisPopup from '../components/AnalysisPopup';
import MediaSharePopup from '../components/MediaSharePopup';

interface ChatWindowProps {
  chatId: string;
  otherUser: ChatUser;
}

const ChatWindowScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { chatId, otherUser } = route.params as ChatWindowProps;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ChatTheme>(NewChatService.getDefaultThemes()[0]);
  const [customTheme, setCustomTheme] = useState({
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    bubbleColor: '#007AFF',
    bubbleTextColor: '#FFFFFF',
    primaryColor: '#007AFF',
    inputBackground: '#F2F2F7',
    placeholderColor: '#8E8E93',
  });
  const [wallpapers, setWallpapers] = useState([
    { id: 'default', name: 'Default', color: '#FFFFFF' },
    { id: 'gradient1', name: 'Ocean Blue', color: '#E3F2FD' },
    { id: 'gradient2', name: 'Sunset', color: '#FFF3E0' },
    { id: 'gradient3', name: 'Forest', color: '#E8F5E8' },
    { id: 'gradient4', name: 'Lavender', color: '#F3E5F5' },
    { id: 'gradient5', name: 'Rose', color: '#FCE4EC' },
  ]);

  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ message: ChatMessage; index: number }[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Shared media functionality
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [sharedMediaCategory, setSharedMediaCategory] = useState<'all' | 'photos' | 'videos' | 'documents' | 'links'>('all');
  const [sharedMedia, setSharedMedia] = useState<{
    photos: ChatMessage[];
    videos: ChatMessage[];
    documents: ChatMessage[];
    links: ChatMessage[];
  }>({
    photos: [],
    videos: [],
    documents: [],
    links: [],
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [showAIPopover, setShowAIPopover] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [showAIResult, setShowAIResult] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestionType, setAiSuggestionType] = useState<'grammar' | 'detailed' | null>(null);
  const [lastAIClick, setLastAIClick] = useState<number>(0);
  const aiProcessingRef = useRef<boolean>(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(null);
  const [showGrammarFix, setShowGrammarFix] = useState(false);
  const [showAIMain, setShowAIMain] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showMediaShare, setShowMediaShare] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string>('');
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textInputRef = useRef<TextInput>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!chatId) return;

    // Reset AI processing state
    aiProcessingRef.current = false;

    // Initialize AI services and load user profiles
    const initializeAI = async () => {
      if (user?.uid) {
        try {
          console.log('🔧 Initializing AI services for chat user:', user.uid);
          
          // Load current user profile
          const currentProfile = await UserService.getUserProfile(user.uid);
          setCurrentUserProfile(currentProfile);
          
          // Load other user profile
          const otherProfile = await UserService.getUserProfile(otherUser.id);
          setOtherUserProfile(otherProfile);
          
          // Initialize AI service
          const service = AIService.getInstance();
          await service.initialize(user.uid);
          setAiService(service);
          
          // Check if AI is enabled
          const isEnabled = service.isAIAvailable();
          setIsAIEnabled(isEnabled);
          
          console.log('🔑 AI service available:', isEnabled);
          console.log('🤖 AI Conversation button should be visible:', isEnabled);
          console.log('📝 AI service instance:', !!service);
          console.log('🔥 Using Google AI API for conversation suggestions!');
        } catch (error) {
          console.error('❌ Failed to initialize AI services:', error);
        }
      }
    };

    initializeAI();

    // Subscribe to messages
    const unsubscribe = NewChatService.subscribeToMessages(chatId, (messageList) => {
      setMessages(messageList);
      
      // Mark unseen messages from other user as seen
      if (user?.uid) {
        const unseenMessagesFromOther = messageList.filter(
          msg => msg.senderId === otherUser.id && 
                 msg.receiverId === user.uid && 
                 !msg.isSeen && 
                 !msg.isDeleted
        );
        
        if (unseenMessagesFromOther.length > 0) {
          const messageIds = unseenMessagesFromOther.map(msg => msg.id);
          NewChatService.markMessagesAsSeen(chatId, messageIds).catch(error => {
            console.error('Error marking messages as seen:', error);
          });
        }
      }
    });

    // Mark as read when screen opens
    if (user?.uid) {
      NewChatService.markAsRead(chatId, user.uid);
    }

    return unsubscribe;
  }, [chatId, user?.uid]);

  useEffect(() => {
    // Monitor typing status
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    if (inputText.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      setIsTyping(true);
      NewChatService.setTyping(chatId, user?.uid || '', true);
    } else if (!inputText.trim() && isTypingRef.current) {
      isTypingRef.current = false;
      setIsTyping(false);
      NewChatService.setTyping(chatId, user?.uid || '', false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    if (inputText.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        setIsTyping(false);
        NewChatService.setTyping(chatId, user?.uid || '', false);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Reset typing state on cleanup
      isTypingRef.current = false;
    };
  }, [inputText, chatId, user?.uid]); // Remove isTyping from dependencies to prevent infinite loop

  // Load saved theme
  useEffect(() => {
    if (chatId) {
      loadSavedTheme();
    }
  }, [chatId]);

  const loadSavedTheme = async () => {
    try {
      console.log('🔍 Loading saved theme for chatId:', chatId);
      console.log('🔍 NewChatService methods:', Object.getOwnPropertyNames(NewChatService));
      const savedTheme = await NewChatService.getChatTheme(chatId);
      console.log('🔍 Saved theme result:', savedTheme);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
  };

  const saveTheme = async (theme: ChatTheme) => {
    try {
      await NewChatService.saveChatTheme(chatId, theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Search functions
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setHighlightedMessageId(null);
      return;
    }

    const results: { message: ChatMessage; index: number }[] = [];
    messages.forEach((message, index) => {
      if (message.text && message.text.toLowerCase().includes(query.toLowerCase())) {
        results.push({ message, index });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    if (results.length > 0) {
      setHighlightedMessageId(results[0].message.id);
      // Scroll to first result
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: results[0].index, animated: true });
        }
      }, 100);
    }
  };

  const navigateToNextResult = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setHighlightedMessageId(searchResults[nextIndex].message.id);
    
    // Scroll to the result
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ 
          index: searchResults[nextIndex].index, 
          animated: true 
        });
      }
    }, 100);
  };

  const navigateToPreviousResult = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    setHighlightedMessageId(searchResults[prevIndex].message.id);
    
    // Scroll to the result
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ 
          index: searchResults[prevIndex].index, 
          animated: true 
        });
      }
    }, 100);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <Text key={index} style={styles.highlightedText}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  // Shared media functions
  const loadSharedMedia = () => {
    const photos: ChatMessage[] = [];
    const videos: ChatMessage[] = [];
    const documents: ChatMessage[] = [];
    const links: ChatMessage[] = [];

    console.log('🔍 Loading shared media from messages:', messages.length);
    console.log('🔍 All messages:', messages.map(m => ({ id: m.id, messageType: m.messageType, type: (m as any).type, text: m.text, mediaUrl: m.mediaUrl })));
    
    messages.forEach((message) => {
      console.log('📱 Message type:', message.messageType, 'Legacy type:', (message as any).type, 'Text:', message.text, 'MediaUrl:', message.mediaUrl);
      
      // Check both messageType and legacy type property
      const messageType = message.messageType || (message as any).type;
      
      if (messageType === 'image') {
        photos.push(message);
        console.log('📸 Added photo:', message.text);
      } else if (messageType === 'video') {
        videos.push(message);
        console.log('🎥 Added video:', message.text);
      } else if (messageType === 'document') {
        documents.push(message);
        console.log('📄 Added document:', message.text);
      } else if (message.text && /^(https?:\/\/|www\.)/i.test(message.text)) {
        links.push(message);
        console.log('🔗 Added link:', message.text);
      }
    });

    console.log('📊 Media counts - Photos:', photos.length, 'Videos:', videos.length, 'Documents:', documents.length, 'Links:', links.length);

    setSharedMedia({
      photos,
      videos,
      documents,
      links,
    });
  };

  const getCurrentMediaList = () => {
    let currentList: ChatMessage[] = [];
    
    switch (sharedMediaCategory) {
      case 'photos':
        currentList = sharedMedia.photos;
        break;
      case 'videos':
        currentList = sharedMedia.videos;
        break;
      case 'documents':
        currentList = sharedMedia.documents;
        break;
      case 'links':
        currentList = sharedMedia.links;
        break;
      default:
        currentList = [...sharedMedia.photos, ...sharedMedia.videos, ...sharedMedia.documents, ...sharedMedia.links];
    }
    
    console.log('📋 Current media list for category', sharedMediaCategory, ':', currentList.length, 'items');
    console.log('📋 Media items:', currentList.map(m => ({ id: m.id, messageType: m.messageType, text: m.text, mediaUrl: m.mediaUrl })));
    return currentList;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user?.uid) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsTyping(false);
    NewChatService.setTyping(chatId, user.uid, false);

    try {
      await NewChatService.sendMessage(
        chatId,
        user.uid,
        otherUser?.id || '',
        messageText
      );
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleMediaMessage = async (media: { type: 'photo' | 'video'; uri: string }) => {
    if (!user?.uid) return;

    try {
      // Create a media message object for immediate UI update
      const mediaMessage = {
        id: Date.now().toString(),
        text: `Sent a ${media.type}`,
        senderId: user.uid,
        timestamp: Date.now(),
        messageType: media.type, // Fix: use messageType instead of type
        mediaUrl: media.uri,
      };

      // Add the media message to the local state immediately for better UX
      setMessages(prev => [...prev, mediaMessage]);

      // Send the media message through the chat service
      await NewChatService.sendMediaMessage(
        chatId,
        user.uid,
        otherUser?.id || '',
        media.uri,
        media.type
      );
      
      console.log(`Media ${media.type} sent successfully`);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error(`Error sending ${media.type}:`, error);
      Alert.alert('Error', `Failed to send ${media.type}. Please try again.`);
      
      // Remove the message from local state if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== mediaMessage.id));
    }
  };

  const handleLinkPress = async (linkText: string) => {
    try {
      // Copy to clipboard using React Native's built-in Clipboard
      Clipboard.setString(linkText);
      
      // Show copy notification
      setShowCopyNotification(true);
      setTimeout(() => {
        setShowCopyNotification(false);
      }, 2000);
      
      // Try to open the link if it's a valid URL
      const urlPattern = /^(https?:\/\/|www\.)/i;
      if (urlPattern.test(linkText)) {
        const url = linkText.startsWith('http') ? linkText : `https://${linkText}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      }
    } catch (error) {
      console.error('Error handling link:', error);
      Alert.alert('Error', 'Failed to copy link or open URL');
    }
  };

  const handleLongPress = (message: ChatMessage) => {
    if (message.senderId !== user?.uid) return;

    Alert.alert(
      'Message Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            setEditingMessage(message);
            setEditText(message.text);
            setShowEditModal(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(message),
        },
      ]
    );
  };

  const deleteMessage = async (message: ChatMessage) => {
    try {
      await NewChatService.deleteMessage(chatId, message.id);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const editMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await NewChatService.editMessage(chatId, editingMessage.id, editText.trim());
      setShowEditModal(false);
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
      Alert.alert('Error', 'Failed to edit message');
    }
  };


  const handleAIOption = async (option: 'analyze' | 'suggestions' | 'grammar' | 'rewrite') => {
    console.log('🎯 AI Option triggered:', option);
    
    // Prevent rapid triggering
    if (aiLoading || aiProcessingRef.current) {
      console.log('⏳ AI already processing, ignoring request');
      return;
    }
    
    aiProcessingRef.current = true;
    setShowAIPopover(false);
    
    if (!aiService || !isAIEnabled) {
      Alert.alert('AI Unavailable', 'AI features are not available. Please check your configuration.');
      return;
    }

    setAiLoading(true);
    try {
      if (option === 'analyze') {
        // Analyze recent chat history
        const recentMessages = messages.slice(-10);
        const analysis = await aiService.getChatSuggestions(otherUser.id, recentMessages, currentUserProfile, otherUserProfile);
        setAiResult(analysis.join('\n\n'));
        setShowAIResult(true);
      } else if (option === 'suggestions') {
        // Get conversation suggestions
        const recentMessages = messages.slice(-5);
        const suggestions = await aiService.getChatSuggestions(otherUser.id, recentMessages, currentUserProfile, otherUserProfile);
        setAiResult(suggestions.join('\n\n'));
        setShowAIResult(true);
      } else if (option === 'grammar' && inputText.trim()) {
        // Get grammar suggestions
        console.log('📝 Getting grammar suggestions for:', inputText);
        const suggestions = await aiService.getGrammarSuggestions(inputText);
        setAiSuggestions(suggestions);
        setAiSuggestionType('grammar');
        setShowAISuggestions(true);
      } else if (option === 'rewrite' && inputText.trim()) {
        // Get detailed review suggestions
        console.log('📝 Getting detailed review suggestions for:', inputText);
        const suggestions = await aiService.getDetailedReviewSuggestions(inputText);
        setAiSuggestions(suggestions);
        setAiSuggestionType('detailed');
        setShowAISuggestions(true);
      } else {
        Alert.alert('No Text', 'Please type a message first to use this feature.');
      }
    } catch (error) {
      console.error('AI option error:', error);
      Alert.alert('Error', 'Failed to process AI request. Please try again.');
    } finally {
      setAiLoading(false);
      aiProcessingRef.current = false;
    }
  };

  const getAISuggestions = async (type: 'analyze' | 'suggestions' | 'grammar' | 'tone') => {
    console.log('🎯 getAISuggestions called with type:', type);
    
    // Prevent rapid triggering
    if (aiLoading || aiProcessingRef.current) {
      console.log('⏳ AI already processing, ignoring request');
      return;
    }
    
    if (!aiService || !isAIEnabled) {
      Alert.alert('AI Unavailable', 'AI features are not available. Please check your configuration.');
      return;
    }

    aiProcessingRef.current = true;
    setAiLoading(true);
    try {
      if (type === 'analyze') {
        // Analyze recent chat history
        const recentMessages = messages.slice(-10);
        const analysis = await aiService.getChatSuggestions(otherUser.id, recentMessages, currentUserProfile, otherUserProfile);
        setAiSuggestions(analysis);
        setShowAISuggestions(true);
      } else if (type === 'suggestions') {
        // Get conversation suggestions
        const recentMessages = messages.slice(-5);
        const suggestions = await aiService.getChatSuggestions(otherUser.id, recentMessages, currentUserProfile, otherUserProfile);
        setAiSuggestions(suggestions);
        setShowAISuggestions(true);
      } else if (type === 'grammar' && inputText.trim()) {
        // Grammar check for current input
        const result = await aiService.fixGrammar(inputText);
        setAiSuggestions([result.correctedText]);
        setShowAISuggestions(true);
      } else if (type === 'tone' && inputText.trim()) {
        // Tone adjustment for current input
        const toneSuggestions = [
          `Professional: ${inputText}`,
          `Friendly: Hey! ${inputText}`,
          `Casual: ${inputText} 😊`,
          `Formal: I would like to ${inputText.toLowerCase()}`,
        ];
        setAiSuggestions(toneSuggestions);
        setShowAISuggestions(true);
      } else {
        Alert.alert('No Text', 'Please type a message first to use this feature.');
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
      Alert.alert('Error', 'Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
      aiProcessingRef.current = false;
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to delete all messages in this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await NewChatService.clearChat(chatId);
              setShowMenu(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear chat');
            }
          },
        },
      ]
    );
  };

  const reportUser = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === user?.uid;
    const isDeleted = item.isDeleted;

    if (isDeleted) {
      return (
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          <View style={[styles.deletedBubble]}>
            <Text style={styles.deletedText}>This message has been deleted</Text>
          </View>
        </View>
      );
    }

    // Handle media messages
    if (item.messageType === 'image' || item.messageType === 'video') {
      return (
        <TouchableOpacity
          style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
        >
          <View style={[
            styles.mediaBubble,
            isMyMessage 
              ? [styles.myBubble, { backgroundColor: currentTheme.bubbleColor }]
              : styles.otherBubble,
          ]}>
            {item.messageType === 'image' ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedImageUri(item.mediaUrl || '');
                  setShowImageModal(true);
                }}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: item.mediaUrl }} 
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setSelectedVideoUri(item.mediaUrl || '');
                  setShowVideoModal(true);
                }}
                activeOpacity={0.8}
                style={styles.videoContainer}
              >
                <Video
                  source={{ uri: item.mediaUrl }}
                  style={styles.videoPreview}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                  isMuted={true}
                />
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={48} color="white" />
                  <Text style={styles.videoText}>Tap to play</Text>
                </View>
              </TouchableOpacity>
            )}
            <Text style={[
              styles.mediaText,
              isMyMessage 
                ? { color: currentTheme.bubbleTextColor }
                : { color: currentTheme.textColor },
            ]}>
              {searchQuery && item.id === highlightedMessageId 
                ? highlightText(item.text, searchQuery)
                : item.text
              }
            </Text>
          </View>
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>
              {item.timestamp && typeof item.timestamp.toDate === 'function' 
                ? item.timestamp.toDate().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : new Date(item.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
              }
            </Text>
            {/* Show seen indicator for my messages */}
            {isMyMessage && (
              <View style={styles.seenIndicator}>
                {item.isSeen ? (
                  <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
                ) : (
                  <Ionicons name="checkmark" size={16} color="#999" />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // Handle text messages
    const isLink = /^(https?:\/\/|www\.)/i.test(item.text);
    
    return (
      <TouchableOpacity
        style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        onPress={isLink ? () => handleLinkPress(item.text) : undefined}
        activeOpacity={isLink ? 0.7 : 1}
      >
        <View style={[
          styles.messageBubble,
          isMyMessage 
            ? [styles.myBubble, { backgroundColor: currentTheme.bubbleColor }]
            : styles.otherBubble,
          isLink && styles.linkBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage 
              ? { color: currentTheme.bubbleTextColor }
              : { color: currentTheme.textColor },
            isLink && styles.linkText,
          ]}>
            {searchQuery && item.id === highlightedMessageId 
              ? highlightText(item.text, searchQuery)
              : item.text
            }
          </Text>
          {isLink && (
            <View style={styles.linkIndicator}>
              <Ionicons name="link" size={12} color={isMyMessage ? currentTheme.bubbleTextColor : currentTheme.textColor} />
              <Text style={[styles.linkLabel, { color: isMyMessage ? currentTheme.bubbleTextColor : currentTheme.textColor }]}>
                Tap to open
              </Text>
            </View>
          )}
          {item.isEdited && (
            <Text style={styles.editedLabel}>edited</Text>
          )}
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {item.timestamp && typeof item.timestamp.toDate === 'function' 
              ? item.timestamp.toDate().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : new Date(item.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
            }
          </Text>
          {/* Show seen indicator for my messages */}
          {isMyMessage && (
            <View style={styles.seenIndicator}>
              {item.isSeen ? (
                <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#999" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const MenuModal = () => (
    <Modal
      visible={showMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={clearChat}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.menuText}>Clear Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              setShowMenu(false);
              setShowThemes(true);
            }}
          >
            <Ionicons name="color-palette" size={20} color="#007AFF" />
            <Text style={styles.menuText}>Edit Theme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            setShowMenu(false);
            setShowSearch(true);
          }}>
            <Ionicons name="search" size={20} color="#007AFF" />
            <Text style={styles.menuText}>Search in Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            setShowMenu(false);
            loadSharedMedia();
            setShowSharedMedia(true);
          }}>
            <Ionicons name="images" size={20} color="#007AFF" />
            <Text style={styles.menuText}>Shared Media</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={reportUser}>
            <Ionicons name="flag" size={20} color="#FF3B30" />
            <Text style={styles.menuText}>Report User</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const handleSuggestionInsert = (suggestion: string) => {
    setInputText(suggestion);
    setShowAISuggestions(false);
    setAiSuggestions([]);
    setAiSuggestionType(null);
  };

  const AIPopover = () => (
    <Modal
      visible={showAIPopover}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowAIPopover(false);
        aiProcessingRef.current = false;
      }}
    >
        <TouchableOpacity
          style={styles.popoverOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAIPopover(false);
            aiProcessingRef.current = false;
          }}
        >
        <View style={styles.popoverContainer}>
          <View style={styles.popoverArrow} />
          <View style={styles.popoverContent}>
            {inputText.trim() ? (
              // Non-empty input options
              <>
                <TouchableOpacity 
                  style={styles.popoverOption}
                  onPress={() => handleAIOption('grammar')}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
                  <Text style={styles.popoverOptionText}>Fix Grammar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.popoverOption}
                  onPress={() => handleAIOption('rewrite')}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                  <Text style={styles.popoverOptionText}>Detailed Rewrite</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Empty input options
              <>
                <TouchableOpacity 
                  style={styles.popoverOption}
                  onPress={() => handleAIOption('analyze')}
                >
                  <Ionicons name="analytics-outline" size={20} color="#007AFF" />
                  <Text style={styles.popoverOptionText}>Analyze Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.popoverOption}
                  onPress={() => handleAIOption('suggestions')}
                >
                  <Ionicons name="bulb-outline" size={20} color="#FF9500" />
                  <Text style={styles.popoverOptionText}>AI Suggestions</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const AIResultModal = () => (
    <Modal
      visible={showAIResult}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAIResult(false)}
    >
      <View style={styles.resultModalOverlay}>
        <View style={styles.resultModalContainer}>
          <View style={styles.resultModalHeader}>
            <Text style={styles.resultModalTitle}>AI Result</Text>
            <TouchableOpacity onPress={() => setShowAIResult(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.resultContent}>
            <Text style={styles.resultText}>{aiResult}</Text>
          </ScrollView>
          
          <View style={styles.resultActions}>
            <TouchableOpacity 
              style={styles.resultButton}
              onPress={() => setShowAIResult(false)}
            >
              <Text style={styles.resultButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.resultButton, styles.acceptButton]}
              onPress={() => {
                setInputText(aiResult);
                setShowAIResult(false);
                setAiResult('');
              }}
            >
              <Text style={[styles.resultButtonText, styles.acceptButtonText]}>Use This</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const AISuggestionsModal = () => (
    <Modal
      visible={showAISuggestions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAISuggestions(false)}
    >
      <View style={styles.suggestionsModalOverlay}>
        <View style={styles.suggestionsModalContainer}>
          <View style={styles.suggestionsModalHeader}>
            <Text style={styles.suggestionsModalTitle}>
              {aiSuggestionType === 'grammar' ? 'Grammar Suggestions' : 'Detailed Review'}
            </Text>
            <TouchableOpacity
              style={styles.suggestionsCloseButton}
              onPress={() => setShowAISuggestions(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
            {aiSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionInsert(suggestion)}
              >
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#007AFF" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const AIModal = () => (
    <Modal
      visible={showAIModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAIModal(false)}
    >
      <View style={styles.aiModalOverlay}>
        <View style={styles.aiModalContainer}>
          <View style={styles.aiModalHeader}>
            <View style={styles.aiModalTitleContainer}>
              <Ionicons name="sparkles" size={24} color="#007AFF" />
              <Text style={styles.aiModalTitle}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAIModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.aiModalSubtitle}>
            Get smart suggestions for your conversation
          </Text>
          
          <View style={styles.aiFeaturesGrid}>
            <TouchableOpacity 
              style={styles.aiFeatureCard}
              onPress={() => getAISuggestions('analyze')}
              disabled={aiLoading}
            >
              <Ionicons name="analytics" size={32} color="#007AFF" />
              <Text style={styles.aiFeatureTitle}>Analyze Chat</Text>
              <Text style={styles.aiFeatureDescription}>Get insights about your conversation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.aiFeatureCard}
              onPress={() => getAISuggestions('suggestions')}
              disabled={aiLoading}
            >
              <Ionicons name="bulb" size={32} color="#FF9500" />
              <Text style={styles.aiFeatureTitle}>Smart Replies</Text>
              <Text style={styles.aiFeatureDescription}>Get suggested responses</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.aiFeatureCard}
              onPress={() => getAISuggestions('grammar')}
              disabled={aiLoading}
            >
              <Ionicons name="checkmark-circle" size={32} color="#34C759" />
              <Text style={styles.aiFeatureTitle}>Grammar Check</Text>
              <Text style={styles.aiFeatureDescription}>Improve your message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.aiFeatureCard}
              onPress={() => getAISuggestions('tone')}
              disabled={aiLoading}
            >
              <Ionicons name="happy" size={32} color="#FF6B6B" />
              <Text style={styles.aiFeatureTitle}>Tone Adjust</Text>
              <Text style={styles.aiFeatureDescription}>Change message tone</Text>
            </TouchableOpacity>
          </View>
          
          {aiLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
          
          {aiSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>AI Suggestions:</Text>
              <ScrollView style={styles.suggestionsList}>
                {aiSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setInputText(suggestion);
                      setShowAIModal(false);
                    }}
                  >
                    <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const ThemeModal = () => (
    <Modal
      visible={showThemes}
      transparent
      animationType="slide"
      onRequestClose={() => setShowThemes(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.themeModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Customize Chat</Text>
            <TouchableOpacity onPress={() => setShowThemes(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.themeScrollView} showsVerticalScrollIndicator={false}>
            {/* Wallpapers Section */}
            <View style={styles.themeSection}>
              <Text style={styles.sectionTitle}>Wallpapers</Text>
              <View style={styles.wallpaperGrid}>
                {wallpapers.map((wallpaper) => (
                  <TouchableOpacity
                    key={wallpaper.id}
                    style={[
                      styles.wallpaperOption,
                      { backgroundColor: wallpaper.color },
                      currentTheme.backgroundColor === wallpaper.color && styles.selectedWallpaper,
                    ]}
                    onPress={() => {
                      const updatedTheme = { ...currentTheme, backgroundColor: wallpaper.color };
                      setCurrentTheme(updatedTheme);
                      saveTheme(updatedTheme);
                    }}
                  >
                    <Text style={styles.wallpaperName}>{wallpaper.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Colors Section */}
            <View style={styles.themeSection}>
              <Text style={styles.sectionTitle}>Text Color</Text>
              <View style={styles.colorGrid}>
                {[
                  { name: 'Black', color: '#000000' },
                  { name: 'Dark Gray', color: '#333333' },
                  { name: 'Blue', color: '#007AFF' },
                  { name: 'Green', color: '#34C759' },
                  { name: 'Red', color: '#FF3B30' },
                  { name: 'Purple', color: '#AF52DE' },
                ].map((color) => (
                  <TouchableOpacity
                    key={color.color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.color },
                      currentTheme.textColor === color.color && styles.selectedColor,
                    ]}
                    onPress={() => {
                      const updatedTheme = { ...currentTheme, textColor: color.color };
                      setCurrentTheme(updatedTheme);
                      saveTheme(updatedTheme);
                    }}
                  >
                    <Text style={styles.colorName}>{color.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bubble Colors Section */}
            <View style={styles.themeSection}>
              <Text style={styles.sectionTitle}>Message Bubble Color</Text>
              <View style={styles.colorGrid}>
                {[
                  { name: 'Blue', color: '#007AFF' },
                  { name: 'Green', color: '#34C759' },
                  { name: 'Red', color: '#FF3B30' },
                  { name: 'Purple', color: '#AF52DE' },
                  { name: 'Orange', color: '#FF9500' },
                  { name: 'Pink', color: '#FF2D92' },
                ].map((color) => (
                  <TouchableOpacity
                    key={color.color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.color },
                      currentTheme.bubbleColor === color.color && styles.selectedColor,
                    ]}
                    onPress={() => {
                      const updatedTheme = { ...currentTheme, bubbleColor: color.color };
                      setCurrentTheme(updatedTheme);
                      saveTheme(updatedTheme);
                    }}
                  >
                    <Text style={styles.colorName}>{color.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Color Section */}
            <View style={styles.themeSection}>
              <Text style={styles.sectionTitle}>Custom Colors</Text>
              <View style={styles.customColorContainer}>
                <TouchableOpacity
                  style={styles.customColorButton}
                  onPress={() => {
                    // For now, just show a placeholder - you can add color picker later
                    Alert.alert('Custom Color', 'Custom color picker coming soon!');
                  }}
                >
                  <Ionicons name="color-palette" size={24} color="#007AFF" />
                  <Text style={styles.customColorText}>Choose Custom Color</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview Section */}
            <View style={styles.themeSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={[styles.previewContainer, { backgroundColor: currentTheme.backgroundColor }]}>
                <View style={[styles.previewBubble, { backgroundColor: currentTheme.bubbleColor }]}>
                  <Text style={[styles.previewText, { color: currentTheme.bubbleTextColor }]}>
                    Hello! This is how your messages will look.
                  </Text>
                </View>
                <View style={[styles.previewOtherBubble, { backgroundColor: '#E5E5EA' }]}>
                  <Text style={[styles.previewOtherText, { color: currentTheme.textColor }]}>
                    And this is how others' messages will appear.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerCenter}
          onPress={() => navigation.navigate('UserProfile' as never, { userId: otherUser.id } as never)}
          activeOpacity={0.7}
        >
          <Avatar
            size="medium"
            source={otherUser?.profilePic}
            fallback={otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : 'U'}
            verified={otherUser?.isVerified}
          />
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={[styles.headerName, { color: currentTheme.textColor }]}>
                {otherUser?.name || 'Unknown User'}
              </Text>
              {otherUser?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
              <Ionicons name="chevron-forward" size={14} color={currentTheme.textColor} style={styles.headerChevron} />
            </View>
            <Text style={[styles.headerStatus, { color: currentTheme.textColor }]}>
              {otherUserTyping ? 'Typing...' : 
               otherUser?.isOnline ? 'Active now' : 'Last seen recently'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />


      {/* Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { color: currentTheme.textColor }]}
            value={inputText}
            onChangeText={(text) => {
              console.log('📝 Text input changed:', text);
              setInputText(text);
            }}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={1000}
            autoFocus={false}
            blurOnSubmit={false}
            editable={true}
          />
          
          {/* AI Button */}
          <AIButton 
            onPress={() => {
              // Dismiss keyboard first
              textInputRef.current?.blur();
              
              if (inputText.trim().length > 0) {
                // Pencil icon - show grammar fix
                console.log('Grammar fix requested for:', inputText);
                setShowGrammarFix(true);
              } else {
                // Plus icon - show AI main popup
                console.log('AI main popup requested');
                setShowAIMain(true);
              }
            }}
            disabled={false}
            hasContent={inputText.trim().length > 0}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <MenuModal />
      <AIPopover />
      <AIResultModal />
      <AISuggestionsModal />
      <AIModal />
      <ThemeModal />

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <KeyboardAvoidingView 
          style={styles.searchModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.searchModalContainer}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Search in Chat</Text>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search messages..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  performSearch(text);
                }}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setCurrentSearchIndex(0);
                    setHighlightedMessageId(null);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
            
            {searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <View style={styles.searchResultsHeader}>
                  <Text style={styles.searchResultsCount}>
                    {currentSearchIndex + 1} of {searchResults.length} results
                  </Text>
                  <View style={styles.searchNavigation}>
                    <TouchableOpacity
                      style={styles.searchNavButton}
                      onPress={navigateToPreviousResult}
                    >
                      <Ionicons name="chevron-up" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.searchNavButton}
                      onPress={navigateToNextResult}
                    >
                      <Ionicons name="chevron-down" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#8E8E93" />
                <Text style={styles.noResultsText}>No messages found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Shared Media Modal */}
      <Modal
        visible={showSharedMedia}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSharedMedia(false)}
      >
        <View style={styles.sharedMediaOverlay}>
          <View style={styles.sharedMediaContainer}>
            <View style={styles.sharedMediaHeader}>
              <View style={styles.sharedMediaTitleContainer}>
                <Text style={styles.sharedMediaTitle}>Shared Media</Text>
                <Text style={styles.sharedMediaSubtitle}>
                  {sharedMedia.photos.length + sharedMedia.videos.length + sharedMedia.documents.length + sharedMedia.links.length} items shared
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSharedMedia(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Category Tabs */}
            <View style={styles.categoryTabs}>
              <TouchableOpacity
                style={[styles.categoryTab, sharedMediaCategory === 'all' && styles.activeCategoryTab]}
                onPress={() => setSharedMediaCategory('all')}
              >
                <Ionicons name="grid" size={16} color={sharedMediaCategory === 'all' ? '#007AFF' : '#8E8E93'} />
                <Text style={[styles.categoryTabText, sharedMediaCategory === 'all' && styles.activeCategoryTabText]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryTab, sharedMediaCategory === 'photos' && styles.activeCategoryTab]}
                onPress={() => setSharedMediaCategory('photos')}
              >
                <Ionicons name="image" size={16} color={sharedMediaCategory === 'photos' ? '#007AFF' : '#8E8E93'} />
                <Text style={[styles.categoryTabText, sharedMediaCategory === 'photos' && styles.activeCategoryTabText]}>
                  Photos ({sharedMedia.photos.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryTab, sharedMediaCategory === 'videos' && styles.activeCategoryTab]}
                onPress={() => setSharedMediaCategory('videos')}
              >
                <Ionicons name="videocam" size={16} color={sharedMediaCategory === 'videos' ? '#007AFF' : '#8E8E93'} />
                <Text style={[styles.categoryTabText, sharedMediaCategory === 'videos' && styles.activeCategoryTabText]}>
                  Videos ({sharedMedia.videos.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryTab, sharedMediaCategory === 'documents' && styles.activeCategoryTab]}
                onPress={() => setSharedMediaCategory('documents')}
              >
                <Ionicons name="document" size={16} color={sharedMediaCategory === 'documents' ? '#007AFF' : '#8E8E93'} />
                <Text style={[styles.categoryTabText, sharedMediaCategory === 'documents' && styles.activeCategoryTabText]}>
                  Documents ({sharedMedia.documents.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryTab, sharedMediaCategory === 'links' && styles.activeCategoryTab]}
                onPress={() => setSharedMediaCategory('links')}
              >
                <Ionicons name="link" size={16} color={sharedMediaCategory === 'links' ? '#007AFF' : '#8E8E93'} />
                <Text style={[styles.categoryTabText, sharedMediaCategory === 'links' && styles.activeCategoryTabText]}>
                  Links ({sharedMedia.links.length})
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Debug Info */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Debug: Photos: {sharedMedia.photos.length}, Videos: {sharedMedia.videos.length}, 
                Documents: {sharedMedia.documents.length}, Links: {sharedMedia.links.length}
              </Text>
              <Text style={styles.debugText}>
                Current Category: {sharedMediaCategory}, Showing: {getCurrentMediaList().length} items
              </Text>
            </View>

            {/* Media Grid */}
            <ScrollView style={styles.mediaGrid} showsVerticalScrollIndicator={false}>
              {getCurrentMediaList().length > 0 ? (
                <View style={styles.mediaGridContent}>
                  {getCurrentMediaList().map((message, index) => (
                    <TouchableOpacity
                      key={message.id}
                      style={styles.mediaItem}
                      onPress={() => {
                        const messageType = message.messageType || (message as any).type;
                        if (messageType === 'image') {
                          setSelectedImageUri(message.mediaUrl || '');
                          setShowImageModal(true);
                        } else if (messageType === 'video') {
                          setSelectedVideoUri(message.mediaUrl || '');
                          setShowVideoModal(true);
                        } else if (messageType === 'document') {
                          // Handle document preview
                          Alert.alert('Document', `Document: ${message.text}`, [
                            { text: 'OK' },
                            { text: 'Open', onPress: () => {
                              if (message.mediaUrl) {
                                Linking.openURL(message.mediaUrl).catch(() => {
                                  Alert.alert('Error', 'Cannot open this document');
                                });
                              }
                            }}
                          ]);
                        } else if (message.text && /^(https?:\/\/|www\.)/i.test(message.text)) {
                          handleLinkPress(message.text);
                        }
                      }}
                    >
                      {(() => {
                        const messageType = message.messageType || (message as any).type;
                        return messageType === 'image' ? (
                          <Image 
                            source={{ uri: message.mediaUrl || 'https://via.placeholder.com/120x120' }} 
                            style={styles.mediaThumbnail}
                            resizeMode="cover"
                            onError={() => console.log('❌ Error loading image:', message.mediaUrl)}
                          />
                        ) : messageType === 'video' ? (
                          <View style={styles.videoThumbnailContainer}>
                            <Image 
                              source={{ uri: message.mediaUrl || 'https://via.placeholder.com/120x120' }} 
                              style={styles.videoThumbnailImage}
                              resizeMode="cover"
                              onError={() => console.log('❌ Error loading video thumbnail:', message.mediaUrl)}
                            />
                            <View style={styles.videoThumbnailOverlay}>
                              <Ionicons name="play-circle" size={32} color="white" />
                            </View>
                          </View>
                        ) : messageType === 'document' ? (
                          <View style={styles.documentThumbnail}>
                            <Ionicons name="document" size={32} color="#007AFF" />
                          </View>
                        ) : (
                          <View style={styles.linkThumbnail}>
                            <Ionicons name="link" size={32} color="#34C759" />
                          </View>
                        );
                      })()}
                      
                      <Text style={styles.mediaItemText} numberOfLines={2}>
                        {(() => {
                          const messageType = message.messageType || (message as any).type;
                          return messageType === 'image' 
                            ? (message.text || 'Photo')
                            : messageType === 'video'
                            ? (message.text || 'Video')
                            : messageType === 'document'
                            ? (message.text || 'Document')
                            : message.text || 'Link';
                        })()}
                      </Text>
                      <Text style={styles.mediaItemDate} numberOfLines={1}>
                        {message.timestamp && typeof message.timestamp.toDate === 'function' 
                          ? message.timestamp.toDate().toLocaleDateString()
                          : new Date(message.timestamp).toLocaleDateString()
                        }
                      </Text>
                      <Text style={styles.mediaItemSender} numberOfLines={1}>
                        {message.senderId === user?.uid ? 'You' : otherUser?.name || 'Other'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noMediaContainer}>
                  <Ionicons name="images" size={48} color="#8E8E93" />
                  <Text style={styles.noMediaText}>
                    No {sharedMediaCategory === 'all' ? 'media' : sharedMediaCategory} shared yet
                  </Text>
                  <Text style={styles.noMediaSubtext}>
                    {sharedMediaCategory === 'all' 
                      ? 'Start sharing photos, videos, documents, or links!'
                      : `Start sharing ${sharedMediaCategory}!`
                    }
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.modalTitle}>Edit Message</Text>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={editMessage}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Grammar Fix Popup */}
      <GrammarFixPopup
        visible={showGrammarFix}
        originalText={inputText}
        onClose={() => {
          setShowGrammarFix(false);
          textInputRef.current?.blur();
        }}
        onInsertText={(text) => {
          setInputText(text);
          setShowGrammarFix(false);
          textInputRef.current?.focus();
        }}
      />

      {/* AI Main Popup */}
      <AIMainPopup
        visible={showAIMain}
        onClose={() => {
          setShowAIMain(false);
          textInputRef.current?.blur();
        }}
        onSuggestions={() => {
          setShowAIMain(false);
          setShowSuggestions(true);
        }}
        onAnalysis={() => {
          setShowAIMain(false);
          setShowAnalysis(true);
        }}
        onMore={() => {
          setShowAIMain(false);
          setShowMediaShare(true);
        }}
      />

      {/* Suggestions Popup */}
      <SuggestionsPopup
        visible={showSuggestions}
        onClose={() => {
          setShowSuggestions(false);
          textInputRef.current?.blur();
        }}
        onSuggestionSelect={(suggestion) => {
          setInputText(suggestion);
          setShowSuggestions(false);
          textInputRef.current?.focus();
        }}
        currentUserProfile={currentUserProfile}
        otherUserProfile={otherUserProfile}
      />

      {/* Analysis Popup */}
      <AnalysisPopup
        visible={showAnalysis}
        onClose={() => {
          setShowAnalysis(false);
          textInputRef.current?.blur();
        }}
        chatHistory={messages}
        onSuggestionSelect={(suggestion) => {
          setInputText(suggestion);
          setShowAnalysis(false);
          textInputRef.current?.focus();
        }}
      />

      {/* Media Share Popup */}
      <MediaSharePopup
        visible={showMediaShare}
        onClose={() => {
          setShowMediaShare(false);
          textInputRef.current?.blur();
        }}
        onMediaSelect={(media) => {
          // Handle media selection
          if (media.type === 'link') {
            setInputText(media.text || '');
            textInputRef.current?.focus();
          } else if (media.type === 'photo' || media.type === 'video') {
            // Send media directly instead of showing URL
            handleMediaMessage(media);
          }
          setShowMediaShare(false);
        }}
      />

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseArea}
            onPress={() => setShowImageModal(false)}
            activeOpacity={1}
          >
            <View style={styles.imageModalContainer}>
              <TouchableOpacity
                style={styles.imageModalCloseButton}
                onPress={() => setShowImageModal(false)}
              >
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.videoModalOverlay}>
          <TouchableOpacity
            style={styles.videoModalCloseArea}
            onPress={() => setShowVideoModal(false)}
            activeOpacity={1}
          >
            <View style={styles.videoModalContainer}>
              <TouchableOpacity
                style={styles.videoModalCloseButton}
                onPress={() => setShowVideoModal(false)}
              >
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
              <Video
                source={{ uri: selectedVideoUri }}
                style={styles.fullScreenVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={false}
                isMuted={false}
                controls={true}
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Copy Notification */}
      {showCopyNotification && (
        <View style={styles.copyNotification}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.copyNotificationText}>Copied to clipboard!</Text>
        </View>
      )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  headerChevron: {
    marginLeft: 4,
    opacity: 0.5,
  },
  headerStatus: {
    fontSize: 12,
    opacity: 0.7,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E5E5E7',
  },
  messageText: {
    fontSize: 16,
  },
  editedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 4,
  },
  deletedBubble: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '80%',
  },
  deletedText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#8E8E93',
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    marginHorizontal: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginHorizontal: 8,
  },
  seenIndicator: {
    marginLeft: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingAIButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
  },
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  aiModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  aiModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aiModalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginVertical: 16,
  },
  aiFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  aiFeatureCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  aiFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 4,
  },
  aiFeatureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#8E8E93',
  },
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionItem: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  // AI Pencil Popover Styles
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  popoverContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popoverArrow: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  popoverContent: {
    padding: 8,
  },
  popoverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 160,
  },
  popoverOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  // AI Result Modal Styles
  resultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  resultModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  resultModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContent: {
    padding: 20,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
  },
  resultActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  acceptButtonText: {
    color: 'white',
  },
  themeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    maxWidth: '95%',
    maxHeight: '80%',
    marginHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  themeOption: {
    width: 80,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: '#007AFF',
  },
  themeBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
  },
  // New theme customization styles
  themeScrollView: {
    maxHeight: 500,
  },
  themeSection: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  wallpaperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wallpaperOption: {
    width: '30%',
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWallpaper: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  wallpaperName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '30%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  customColorContainer: {
    alignItems: 'center',
  },
  customColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  customColorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  previewContainer: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  previewOtherBubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  previewOtherText: {
    fontSize: 14,
  },
  editModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxWidth: '90%',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    maxHeight: 120,
    marginVertical: 16,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Glass theme suggestions modal styles
  suggestionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsModalContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  suggestionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 122, 255, 0.2)',
  },
  suggestionsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  suggestionsCloseButton: {
    padding: 4,
  },
  suggestionsList: {
    maxHeight: 400,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  suggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    marginRight: 12,
  },
  // Media message styles
  mediaBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 8,
    marginVertical: 2,
    backgroundColor: 'transparent', // Remove any background color
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'transparent', // Remove any background color
  },
  videoContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#000',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  mediaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Image modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  // Video modal styles
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  // Link styles
  linkBubble: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  linkLabel: {
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Copy notification styles
  copyNotification: {
    position: 'absolute',
    top: 100,
    left: '50%',
    marginLeft: -80,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  copyNotificationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Search styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  searchModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '60%',
    minHeight: 200,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  searchResultsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  searchNavigation: {
    flexDirection: 'row',
  },
  searchNavButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  highlightedText: {
    backgroundColor: '#FFEB3B',
    fontWeight: '600',
  },
  // Shared media styles
  sharedMediaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sharedMediaContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  sharedMediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  sharedMediaTitleContainer: {
    flex: 1,
  },
  sharedMediaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sharedMediaSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  activeCategoryTab: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  categoryTabText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: '#007AFF',
  },
  mediaGrid: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mediaGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  mediaItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  mediaThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoThumbnailContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  documentThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaItemText: {
    fontSize: 12,
    color: '#1C1C1E',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  mediaItemDate: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 2,
  },
  mediaItemSender: {
    fontSize: 10,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  noMediaContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noMediaText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  noMediaSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  // Debug styles
  debugContainer: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
});

export default ChatWindowScreen; 