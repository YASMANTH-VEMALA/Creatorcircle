import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { PostService } from '../services/postService';
import PostCard from '../components/PostCard';
import NotificationIndicator from '../components/NotificationIndicator';
import MessageIndicator from '../components/MessageIndicator';
import { useNavigation } from '@react-navigation/native';
import { ProfileValidationService } from '../services/profileValidationService';
import CreatorCircleLoading from '../components/CreatorCircleLoading';
import { FirebaseUtils } from '../utils/firebaseUtils';
import { RealtimeMigrationService } from '../services/realtimeMigrationService';
import { useScroll } from '../contexts/ScrollContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork } from '../contexts/NetworkContext';
import { OfflineService } from '../services/offlineService';
import PremiumFeatureModal from '../components/PremiumFeatureModal';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { notifyScroll } = useScroll();
  const { colors } = useTheme();
  const { isOffline } = useNetwork();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [cachedPosts, setCachedPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadCachedPosts();
    let unsubscribe: (() => void) | undefined;
    
    if (!isOffline) {
      testFirebaseConnection();
      startRealtimeMonitoring();
      unsubscribe = setupPostsSubscription();
    } else {
      // If offline, show cached posts immediately
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOffline, loadCachedPosts, setupPostsSubscription]);

  const loadCachedPosts = useCallback(async () => {
    try {
      const cached = await OfflineService.getCachedPosts();
      if (cached && cached.length > 0) {
        setCachedPosts(cached);
        console.log(`📱 Loaded ${cached.length} cached posts`);
      }
    } catch (error) {
      console.error('❌ Error loading cached posts:', error);
    }
  }, []);

  const setupPostsSubscription = useCallback(() => {
    try {
      const unsubscribe = PostService.subscribeToPosts((loadedPosts) => {
        try {
          console.log(`Posts loaded in HomeScreen: ${loadedPosts.length}`);
          setPosts(loadedPosts);
          setLoading(false);
          
          // Cache posts for offline use
          OfflineService.cachePosts(loadedPosts).catch(error => {
            console.error('❌ Error caching posts:', error);
          });
        } catch (error) {
          console.error('❌ Error processing loaded posts:', error);
          setLoading(false);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up posts subscription:', error);
      setLoading(false);
      return () => {};
    }
  }, []);

  const startRealtimeMonitoring = () => {
    try {
      console.log('🔍 Starting real-time monitoring for local files...');
      RealtimeMigrationService.startMonitoring();
    } catch (error) {
      console.error('Error starting real-time monitoring:', error);
      // Don't crash the app if monitoring fails
    }
  };

  const testFirebaseConnection = async () => {
    try {
      const isConnected = await FirebaseUtils.testFirebaseConnection();
      if (isConnected) {
        const projectValidation = await FirebaseUtils.validateFirebaseProject();
        console.log('Firebase project validation:', projectValidation);
      }
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      // Don't crash the app if Firebase test fails
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isOffline) {
      // If offline, just reload cached posts
      await loadCachedPosts();
    } else {
      // If online, the subscription will automatically update
      // Just wait a bit for the refresh to feel natural
      setTimeout(() => setRefreshing(false), 1000);
    }
    setRefreshing(false);
  };

  // Create post functionality moved to PostScreen
  const handleCreatePost = () => {
    navigation.navigate('Post' as never);
  };

  const handlePostCreated = () => {
    console.log('Post created successfully');
  };

  const handlePostUpdate = () => {
    console.log('Post updated successfully');
  };


  const handleMessage = () => {
    navigation.navigate('MessagesList' as never);
  };

  const handleNotifications = () => {
    console.log('🔔 Notification button pressed, navigating to Notifications screen');
    try {
      navigation.navigate('Notifications' as never);
      console.log('✅ Navigation to Notifications successful');
    } catch (error) {
      console.error('❌ Error navigating to Notifications:', error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    console.log('Rendering post:', item.id, item.content?.substring(0, 30) + '...');
    return (
      <PostCard 
        post={item} 
        onPostUpdate={handlePostUpdate}
        showUserProfile={true}
        isInProfile={false}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
      <TouchableOpacity style={styles.createPostButton} onPress={handleCreatePost}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.createPostButtonText}>Create Post</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOfflineEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wifi-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>You're offline</Text>
      <Text style={styles.emptySubtitle}>
        No cached posts available. Connect to the internet to see the latest content.
      </Text>
    </View>
  );

  const renderSkeletonLoading = () => (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            <Text style={[styles.creatorText, { color: colors.text }]}>Creator</Text>
            <Text style={[styles.circleText, { color: colors.secondary }]}>Circle</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.headerButton, { 
            backgroundColor: colors.glassBackground,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }]} />
          <View style={[styles.headerButton, { 
            backgroundColor: colors.glassBackground,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }]} />
          <View style={[styles.headerButton, { 
            backgroundColor: colors.glassBackground,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }]} />
        </View>
      </View>

      {/* Skeleton Posts */}
      <FlatList
        data={[1, 2, 3, 4, 5]} // Render 5 skeleton items
        renderItem={() => <PostCardSkeleton />}
        keyExtractor={(item) => `skeleton-${item}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
        style={styles.flatList}
        scrollEventThrottle={16}
      />
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <CreatorCircleLoading />
      <Text style={styles.loadingText}>Loading posts...</Text>
    </View>
  );

  // Show skeleton loading for initial load or when offline and no cached data
  if (loading && !isOffline) {
    return renderSkeletonLoading();
  }

  // Show loading screen only for very initial app load
  if (loading && isOffline && cachedPosts.length === 0) {
    return renderLoadingState();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            <Text style={[styles.creatorText, { color: colors.text }]}>Creator</Text>
            <Text style={[styles.circleText, { color: colors.secondary }]}>Circle</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerButton, { 
              backgroundColor: colors.glassBackground,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }]} 
            onPress={() => navigation.navigate('Spotlight' as never)}
          >
            <Ionicons name="flash" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { 
            backgroundColor: colors.glassBackground,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }]} onPress={handleMessage}>
            <View style={styles.messageContainer}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              <MessageIndicator size="small" showCount={false} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { 
            backgroundColor: colors.glassBackground,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }]} onPress={handleNotifications}>
            <View style={styles.notificationContainer}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
              <NotificationIndicator size="small" showCount={false} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts List */}
      <FlatList
        data={isOffline ? cachedPosts : posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            enabled={!isOffline} // Disable refresh when offline
          />
        }
        ListEmptyComponent={isOffline ? renderOfflineEmptyState : renderEmptyState}
        contentContainerStyle={styles.postsList}
        style={styles.flatList}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          notifyScroll(scrollY);
        }}
        scrollEventThrottle={16}
      />

      {/* Create Post Button - Removed for cleaner UI */}

      {/* Create Post Modal - Removed from HomeScreen */}

      {/* Premium Feature Modal */}
      <PremiumFeatureModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="Spotlight Videos"
        description="Create and share short video stories up to 60 seconds. Showcase your creativity and get noticed by other creators with our premium Spotlight feature."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  creatorText: {
    // Color will be set dynamically
  },
  circleText: {
    // Color will be set dynamically
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 12,
  },
  notificationContainer: {
    position: 'relative',
  },
  messageContainer: {
    position: 'relative',
  },
  flatList: {
    width: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  postsList: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen; 