import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, FlatList, TouchableOpacity, Text, StatusBar, Modal, Image, Animated, TextInput, ScrollView, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatusSuccess } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SpotlightPost } from '../types';
import { SpotlightService } from '../services/spotlightService';
import { VideoPreloadService } from '../services/videoPreloadService';
import { ShareService } from '../services/shareService';
import { UserService } from '../services/userService';

const { height } = Dimensions.get('window');

const SpotlightScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [reels, setReels] = useState<SpotlightPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());
  const [realTimeLikes, setRealTimeLikes] = useState<Map<string, number>>(new Map());
  const [realTimeComments, setRealTimeComments] = useState<Map<string, any[]>>(new Map());
  const videoRefs = useRef<Map<string, Video | null>>(new Map());
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = SpotlightService.subscribeToSpotlight((items) => {
      setReels(items);
      // Preload first few videos immediately
      preloadInitialVideos(items);
      // Set initial likes count
      if (items.length > 0) {
        setLikesCount(items[0].likesCount || 0);
      }
      // Load user profiles for all creators
      loadUserProfiles(items);
    });
    return unsubscribe;
  }, []);

  const loadUserProfiles = async (spotlightPosts: SpotlightPost[]) => {
    const newProfiles = new Map(userProfiles);
    
    for (const post of spotlightPosts) {
      if (post.creatorId && !newProfiles.has(post.creatorId)) {
        try {
          const profile = await UserService.getUserProfile(post.creatorId);
          if (profile) {
            newProfiles.set(post.creatorId, profile);
          }
        } catch (error) {
          console.error('Error loading user profile:', post.creatorId, error);
        }
      }
    }
    
    setUserProfiles(newProfiles);
  };

  const preloadInitialVideos = async (items: SpotlightPost[]) => {
    // Preload first 3 videos immediately for instant playback
    const videosToPreload = items.slice(0, 3).map(item => ({
      url: item.videoUrl,
      id: item.id
    }));
    
    VideoPreloadService.preloadMultipleVideos(videosToPreload);
    console.log(`🚀 Preloading initial ${videosToPreload.length} videos`);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const first = viewableItems[0];
      const newIndex = first.index ?? 0;
      setCurrentIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = { itemVisiblePercentThreshold: 80 };

  const toggleMute = () => {
    setMuted((m) => !m);
    setShowMuteIndicator(true);
    setTimeout(() => setShowMuteIndicator(false), 1000);
  };
  
  const handleLike = async () => {
    const currentVideo = reels[currentIndex];
    if (!currentVideo || !user?.uid) return;
    
    try {
      if (isLiked) {
        await SpotlightService.unlikeSpotlightPost(currentVideo.id, user.uid);
        console.log('Unliked video:', currentVideo.id);
      } else {
        await SpotlightService.likeSpotlightPost(currentVideo.id, user.uid);
        console.log('Liked video:', currentVideo.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  const handleComment = () => {
    const currentVideo = reels[currentIndex];
    if (!currentVideo) return;
    
    // Close user modal first
    setShowUserModal(false);
    
    // Open comments modal
    setShowCommentsModal(true);
    console.log('Open comments for video:', currentVideo.id);
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.uid) return;
    
    const currentVideo = reels[currentIndex];
    if (!currentVideo) return;
    
    try {
      const userProfile = userProfiles.get(user.uid) || user;
      await SpotlightService.addComment(currentVideo.id, user.uid, newComment, userProfile);
      setNewComment('');
      console.log('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Comments are now loaded via real-time subscription in the main useEffect
  
  const handleFollow = () => {
    const currentVideo = reels[currentIndex];
    if (!currentVideo) return;
    
    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} user:`, currentVideo.creatorName);
  };
  
  const handleShare = () => {
    // Close user modal first
    setShowUserModal(false);
    
    // Open share modal
    setShowShareModal(true);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // TODO: Implement actual user search API
    // For now, using mock data
    const mockUsers = [
      { id: '1', name: 'John Doe', username: 'johndoe', avatar: 'https://via.placeholder.com/50x50/FF6B35/FFFFFF?text=J' },
      { id: '2', name: 'Jane Smith', username: 'janesmith', avatar: 'https://via.placeholder.com/50x50/FF6B35/FFFFFF?text=J' },
      { id: '3', name: 'Mike Johnson', username: 'mikej', avatar: 'https://via.placeholder.com/50x50/FF6B35/FFFFFF?text=M' },
    ];
    
    const filtered = mockUsers.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };
  
  const handleSendToUser = async (user: any) => {
    const currentVideo = reels[currentIndex];
    if (!currentVideo) return;
    
    try {
      await ShareService.shareToUser(currentVideo, user.id);
      
      // Close modal after sharing
      setShowShareModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sharing to user:', error);
    }
  };

  const handleProfilePress = () => {
    const currentVideo = reels[currentIndex];
    if (!currentVideo) return;
    
    // Close user modal first
    setShowUserModal(false);
    
    // Navigate to user profile page
    navigation.navigate('UserProfile', { userId: currentVideo.creatorId });
    console.log('Navigate to profile:', currentVideo.creatorId);
  };

  const handleDeleteSpotlight = () => {
    const currentVideo = reels[currentIndex];
    if (!currentVideo) return;
    
    Alert.alert(
      'Delete Spotlight',
      'Are you sure you want to delete this spotlight? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SpotlightService.deleteSpotlightPost(
                currentVideo.id,
                currentVideo.videoUrl,
                currentVideo.thumbnailUrl
              );
              
              // Remove from local state
              setReels(prev => prev.filter(post => post.id !== currentVideo.id));
              
              // If this was the last video, go back
              if (reels.length <= 1) {
                navigation.goBack();
              } else {
                // Move to previous video
                setCurrentIndex(prev => Math.max(0, prev - 1));
              }
              
              Alert.alert('Success', 'Spotlight deleted successfully');
            } catch (error) {
              console.error('Error deleting spotlight:', error);
              Alert.alert('Error', 'Failed to delete spotlight. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle video playback - only control play/pause
  useEffect(() => {
    // Pause all videos except current
    videoRefs.current.forEach((ref, key) => {
      if (!ref) return;
      if (reels[currentIndex]?.id === key) {
        ref.setStatusAsync({ shouldPlay: true, isMuted: muted }).catch(() => {});
      } else {
        ref.setStatusAsync({ shouldPlay: false }).catch(() => {});
      }
    });
  }, [currentIndex, muted]);

  // Handle preloading separately to avoid infinite loops
  useEffect(() => {
    if (reels.length === 0) return;

    // Update likes count for current video and subscribe to real-time interactions
    const currentVideo = reels[currentIndex];
    if (currentVideo) {
      // Subscribe to real-time interactions for current video
      const unsubscribe = SpotlightService.subscribeToSpotlightInteractions(
        currentVideo.id,
        (data) => {
          setLikesCount(data.likesCount);
          setIsLiked(data.likedBy.includes(user?.uid || ''));
          setComments(data.comments.sort((a, b) => {
            // Handle both Firestore timestamps and regular Date objects
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
            return timeB.getTime() - timeA.getTime();
          }));
        }
      );
      
      setIsFollowing(false); // Reset follow state for new video
      
      return unsubscribe;
    }
  }, [currentIndex, reels, user?.uid]);

  // Handle video preloading separately
  useEffect(() => {
    if (reels.length === 0) return;
    
    const currentVideo = reels[currentIndex];
    // Preload current video immediately for instant playback
    if (currentVideo) {
      setIsBuffering(true);
      setBufferingProgress(0);
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
      
      VideoPreloadService.preloadVideo(currentVideo.videoUrl, currentVideo.id).then(() => {
        setIsBuffering(false);
        setBufferingProgress(100);
        spinValue.stopAnimation();
        console.log(`✅ Current video ready: ${currentVideo.id}`);
      });
    }

    // Preload next 2 videos for smooth scrolling
    const nextVideos = reels.slice(currentIndex + 1, currentIndex + 3);
    const videosToPreload = nextVideos.map(video => ({ url: video.videoUrl, id: video.id }));

    if (videosToPreload.length > 0) {
      VideoPreloadService.preloadMultipleVideos(videosToPreload).then(() => {
        console.log(`✅ Preloaded ${videosToPreload.length} videos for index ${currentIndex}`);
      });
    }
  }, [currentIndex, reels]);

  const renderItem = useCallback(({ item, index }: { item: SpotlightPost; index: number }) => {
    return (
      <View style={[styles.page, { backgroundColor: 'black' }]}> 
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={toggleMute}>
          <Video
            ref={(ref) => videoRefs.current.set(item.id, ref)}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            shouldPlay={index === currentIndex}
            isLooping
            isMuted={muted}
            resizeMode={ResizeMode.COVER}
            onLoad={() => {
              console.log(`✅ Video loaded: ${item.id}`);
            }}
            onError={(e) => {
              console.error('Spotlight video error', e);
            }}
            onPlaybackStatusUpdate={(status) => {
              const s = status as AVPlaybackStatusSuccess;
              if (!s.isLoaded) return;
              // Do not auto-advance; prevents audio overlap
            }}
          />
        </TouchableOpacity>
        {/* Bottom overlay with caption only */}
        <View style={styles.bottomOverlay} pointerEvents="none">
          <Text style={styles.caption} numberOfLines={3}>
            {item.caption || 'Check out this spotlight!'}
          </Text>
        </View>
        
        {/* Right side - only + button */}
        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowUserModal(true)}>
            <Ionicons name="add-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Mute indicator */}
        {showMuteIndicator && (
          <View style={styles.muteIndicator}>
            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
          </View>
        )}
        
        {/* Buffering indicator */}
        {isBuffering && index === currentIndex && (
          <View style={styles.bufferingIndicator}>
            <View style={styles.bufferingSpinner}>
              <Animated.View
                style={{
                  transform: [{
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
              </Animated.View>
            </View>
            <Text style={styles.bufferingText}>Loading... {bufferingProgress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${bufferingProgress}%` }]} />
            </View>
          </View>
        )}
      </View>
    );
  }, [currentIndex, muted]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle="light-content" hidden />
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      />
      
      {/* User Profile Modal */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUserModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userProfile}>
              <TouchableOpacity onPress={handleProfilePress}>
                <Image 
                  source={{ 
                    uri: userProfiles.get(reels[currentIndex]?.creatorId)?.profilePhotoUrl || 
                         reels[currentIndex]?.creatorAvatar || 
                         'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=U' 
                  }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleProfilePress}>
                <Text style={styles.profileName}>
                  @{userProfiles.get(reels[currentIndex]?.creatorId)?.name || 
                    reels[currentIndex]?.creatorName || 
                    'unknown_user'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.profileBio}>
                {userProfiles.get(reels[currentIndex]?.creatorId)?.aboutMe || 'Content Creator'} • {reels[currentIndex]?.createdAt ? new Date(reels[currentIndex].createdAt).toLocaleDateString() : 'Recently'}
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.modalActionButton} onPress={handleLike}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FF6B35" : "#FF6B35"} />
                <Text style={styles.modalActionText}>{isLiked ? 'Liked' : 'Like'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalActionButton} onPress={handleComment}>
                <Ionicons name="chatbubble-outline" size={24} color="#FF6B35" />
                <Text style={styles.modalActionText}>Comment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalActionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#FF6B35" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              
              {/* Show delete button only for current user's own posts */}
              {user && reels[currentIndex]?.creatorId === user.uid && (
                <TouchableOpacity style={[styles.modalActionButton, styles.deleteButton]} onPress={handleDeleteSpotlight}>
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.modalActionText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.modalActionButton} onPress={handleFollow}>
                <Ionicons name={isFollowing ? "person-remove-outline" : "person-add-outline"} size={24} color="#FF6B35" />
                <Text style={styles.modalActionText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{likesCount || reels[currentIndex]?.likesCount || 0}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{reels[currentIndex]?.commentsCount || 0}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{reels[currentIndex]?.viewsCount || 0}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <TouchableOpacity 
            style={styles.shareModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Spotlight</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowShareModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {/* Video Preview */}
            <View style={styles.shareVideoPreview}>
              <Image 
                source={{ uri: reels[currentIndex]?.thumbnailUrl || 'https://via.placeholder.com/100x150/FF6B35/FFFFFF?text=Video' }}
                style={styles.shareThumbnail}
              />
              <View style={styles.shareVideoInfo}>
                <Text style={styles.shareVideoTitle}>@{reels[currentIndex]?.creatorName || 'unknown_user'}</Text>
                <Text style={styles.shareVideoCaption} numberOfLines={2}>
                  {reels[currentIndex]?.caption || 'Check out this spotlight!'}
                </Text>
              </View>
            </View>
            
            {/* Native Share Button */}
            <TouchableOpacity 
              style={styles.nativeShareButton}
              onPress={async () => {
                const currentVideo = reels[currentIndex];
                if (currentVideo) {
                  await ShareService.shareViaNative(currentVideo);
                }
              }}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.nativeShareText}>Share via...</Text>
            </TouchableOpacity>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users to share with..."
                value={searchQuery}
                onChangeText={handleSearchUsers}
                placeholderTextColor="#666"
              />
            </View>
            
            {/* Search Results */}
            <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
              {searchResults.map((user) => (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.userResultItem}
                  onPress={() => handleSendToUser(user)}
                >
                  <Image source={{ uri: user.avatar }} style={styles.userResultAvatar} />
                  <View style={styles.userResultInfo}>
                    <Text style={styles.userResultName}>{user.name}</Text>
                    <Text style={styles.userResultUsername}>@{user.username}</Text>
                  </View>
                  <Ionicons name="send" size={20} color="#FF6B35" />
                </TouchableOpacity>
              ))}
              
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <Text style={styles.noResultsText}>No users found</Text>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCommentsModal(false)}
        >
          <TouchableOpacity 
            style={styles.commentsModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCommentsModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <TouchableOpacity>
                    <Image 
                      source={{ uri: comment.avatar }}
                      style={styles.commentAvatar}
                    />
                  </TouchableOpacity>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <TouchableOpacity>
                        <Text style={styles.commentAuthor}>@{comment.username}</Text>
                      </TouchableOpacity>
                      <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <View style={styles.commentActions}>
                      <TouchableOpacity style={styles.commentActionButton}>
                        <Ionicons name="heart-outline" size={14} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentActionButton}>
                        <Ionicons name="chatbubble-outline" size={14} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              
              {comments.length === 0 && (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
                </View>
              )}
            </ScrollView>
            
            {/* Add Comment */}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor="#666"
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.5 }]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  page: {
    height,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 60,
    bottom: 20,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  rightButtons: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  muteIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -30 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferingSpinner: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 15,
    marginBottom: 10,
  },
  bufferingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  userProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  profileBio: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalActionButton: {
    alignItems: 'center',
    padding: 10,
  },
  modalActionText: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 5,
  },
  deleteButton: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Share Modal styles
  shareModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '85%',
  },
  shareVideoPreview: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  shareThumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  shareVideoInfo: {
    flex: 1,
  },
  shareVideoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  shareVideoCaption: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  nativeShareButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nativeShareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  searchResults: {
    maxHeight: 300,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userResultInfo: {
    flex: 1,
  },
  userResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  userResultUsername: {
    fontSize: 14,
    color: '#666',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    paddingVertical: 20,
  },
  // Comments Modal styles
  commentsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: '95%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  commentsList: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentActionButton: {
    marginRight: 16,
    paddingVertical: 4,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    maxHeight: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SpotlightScreen;


