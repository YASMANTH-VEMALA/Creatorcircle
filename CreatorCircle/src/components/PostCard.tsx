import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Post, Comment, Report, RootStackParamList } from '../types';
import { PostService } from '../services/postService';
import { UserService } from '../services/userService';
import { ProfileValidationService } from '../services/profileValidationService';
import PostImageStack from './PostImageStack';
import PostEditModal from './PostEditModal';
import PostTextComponent from './PostTextComponent';
import { ImageUtils } from '../utils/imageUtils';
import { Video, ResizeMode } from 'expo-av';
import { VideoErrorHandler } from '../utils/videoErrorHandler';
import { Avatar } from './ui/Avatar';
import { xpService } from '../services/xpService';
import { notificationService } from '../services/notificationService';
import ShareModal from './ShareModal';
import ChatShareModal from './ChatShareModal';

const { width } = Dimensions.get('window');

// LinkedIn-style reaction options
const REACTION_OPTIONS = [
  { emoji: '👍', name: 'Like', color: '#0077B5' },
  { emoji: '🎉', name: 'Celebrate', color: '#FF6B35' },
  { emoji: '❤️', name: 'Love', color: '#E31B23' },
  { emoji: '🤔', name: 'Insightful', color: '#8E44AD' },
  { emoji: '😂', name: 'Funny', color: '#F39C12' },
  { emoji: '🙏', name: 'Support', color: '#27AE60' },
];

type PostCardNavigationProp = StackNavigationProp<RootStackParamList>;

interface PostCardProps {
  post: Post;
  onPostUpdate: () => void;
  showUserProfile?: boolean;
  isInProfile?: boolean;
}

const PostCard: React.FC<PostCardProps> = React.memo(({ 
  post, 
  onPostUpdate, 
  showUserProfile = true,
  isInProfile = false 
}) => {
  const navigation = useNavigation<PostCardNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  // State management
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState<{ [emoji: string]: number }>({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [fullscreenImageLoading, setFullscreenImageLoading] = useState<{ [key: number]: boolean }>({});
  const [fullscreenImageErrors, setFullscreenImageErrors] = useState<{ [key: number]: boolean }>({});
  const [avatarError, setAvatarError] = useState(false);
  const [userVerifiedBadge, setUserVerifiedBadge] = useState<'none' | 'silver' | 'gold'>('none');
  // New state for comment replies and likes
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
  const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: boolean }>({});
  const [commentLikesCount, setCommentLikesCount] = useState<{ [commentId: string]: number }>({});
  const [reportCount, setReportCount] = useState(post.reports || 0);
  // Comment editing and menu states
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentMenu, setShowCommentMenu] = useState<string | null>(null); // commentId or null
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChatShareModal, setShowChatShareModal] = useState(false);
  
  // Ref to track if comments have been loaded for this post
  const commentsLoadedRef = useRef<boolean>(false);

  // Memoize the post ID to prevent unnecessary re-renders
  const postId = useMemo(() => post.id, [post.id]);
  const postUserId = useMemo(() => post.userId, [post.userId]);

  // Debug effect to track reaction picker state
  useEffect(() => {
    console.log('🎯 Reaction picker state changed:', showReactionPicker);
  }, [showReactionPicker]);

  // Consolidated initialization effect
  useEffect(() => {
    if (user?.uid && postId) {
      initializePost();
    }
  }, [user?.uid, postId]);

  // Load user profile for post if missing data
  useEffect(() => {
    const loadUserProfile = async () => {
      // Only load if we're missing critical user data and haven't loaded profile yet
      if ((!post.userName || !post.userAvatar || !post.userCollege) && !userProfile && post.userId && !loadingUserProfile) {
        try {
          setLoadingUserProfile(true);
          console.log(`🔍 Loading user profile for post ${post.id}, userId: ${post.userId}`);
          const profile = await UserService.getUserProfile(post.userId);
          if (profile) {
            console.log(`✅ Loaded user profile for post ${post.id}:`, {
              name: profile.name,
              profilePhotoUrl: profile.profilePhotoUrl,
              college: profile.college
            });
            setUserProfile(profile);
          } else {
            console.warn(`⚠️ User profile not found for userId: ${post.userId}`);
          }
        } catch (error) {
          console.error(`❌ Error loading user profile for post ${post.id}:`, error);
        } finally {
          setLoadingUserProfile(false);
        }
      }
    };

    loadUserProfile();
  }, [post.userId, post.userName, post.userAvatar, post.userCollege, userProfile, loadingUserProfile]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // setIsOptimisticUpdate(false); // Removed
      // setIsCommentOptimisticUpdate({}); // Removed
    };
  }, []);

  // Load comments when comments section is opened
  useEffect(() => {
    const loadComments = async () => {
      if (showComments && postId && !commentsLoadedRef.current && !loadingComments) {
        try {
          setLoadingComments(true);
          commentsLoadedRef.current = true; // Mark as loading to prevent multiple calls
          console.log(`🔍 Loading comments for post: ${postId}`);
          const postComments = await PostService.getComments(postId);
          console.log(`📝 Comment data loaded:`, postComments.map(c => ({
            id: c.id,
            userName: c.userName,
            content: c.content,
            contentLength: c.content?.length || 0
          })));
          setComments(postComments);
          console.log(`✅ Loaded ${postComments.length} comments for post: ${postId}`);
        } catch (error) {
          console.error(`❌ Error loading comments for post ${postId}:`, error);
          commentsLoadedRef.current = false; // Reset on error to allow retry
          Alert.alert('Error', 'Failed to load comments. Please try again.');
        } finally {
          setLoadingComments(false);
        }
      } else if (!showComments) {
        // Reset the loaded flag when comments section is closed
        commentsLoadedRef.current = false;
      }
    };

    loadComments();
  }, [showComments, postId]);

  // Close comment menu when comments section is closed
  useEffect(() => {
    if (!showComments) {
      setShowCommentMenu(null);
      setEditingComment(null);
      setEditCommentText('');
    }
  }, [showComments]);

  // Real-time updates effect
  useEffect(() => {
    if (postId) {
      const unsubscribe = PostService.subscribeToPostUpdates(postId, (updates) => {
        // Only update if the server data is different from our current state
        // This prevents conflicts with optimistic updates
        if (updates.likes !== likesCount) {
          setLikesCount(updates.likes);
        }
        if (updates.reactions) {
          setReactions(updates.reactions);
        }
        if (onPostUpdate) {
          onPostUpdate();
        }
      });
      
      return unsubscribe;
    }
  }, [postId, onPostUpdate, likesCount]);

  const initializePost = useCallback(async () => {
    if (!user?.uid || !postId) return;

    try {
      // Load user's reaction for this post
      const userReactionData = await PostService.getUserReaction(postId, user.uid);
      setUserReaction(userReactionData);
      setHasLiked(!!userReactionData);

      // Load post reactions
      const reactionsData = await PostService.getPostReactions(postId);
      setReactions(reactionsData);

      // Load other post data
      await loadUserProfile();
      await checkLikeStatus();
      await loadComments();
    } catch (error) {
      console.error('Error initializing post:', error);
    }
  }, [user?.uid, postId]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await UserService.getUserProfile(postUserId);
      setUserProfile(profile);
      
      // Set default verified badge (no premium service)
      setUserVerifiedBadge('none');
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [postUserId]);

  const checkLikeStatus = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const liked = await PostService.hasUserLiked(postId, user.uid);
      setHasLiked(liked);
    } catch (error) {
      console.error('❌ Error checking like status:', error);
    }
  }, [user?.uid, postId]);

  const loadComments = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoadingComments(true);
      const unsubscribe = PostService.subscribeToComments(postId, (newComments) => {
        setComments(newComments);
        
        // Initialize comment likes state
        const likesState: { [commentId: string]: boolean } = {};
        const likesCountState: { [commentId: string]: number } = {};
        
        newComments.forEach(comment => {
          likesState[comment.id] = false; // Will be updated below
          likesCountState[comment.id] = comment.likes || 0;
        });
        
        setCommentLikesCount(likesCountState);
        setLoadingComments(false);
        
        // Check like status for each comment
        newComments.forEach(async (comment) => {
          try {
            const commentLiked = await PostService.hasUserLikedComment(postId, comment.id, user.uid);
            setCommentLikes(prev => ({ ...prev, [comment.id]: commentLiked }));
          } catch (error) {
            console.error('Error checking comment like status:', error);
          }
        });
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error loading comments:', error);
      setLoadingComments(false);
    }
  }, [user?.uid, postId]);

  const handleReaction = async (reactionEmoji: string) => {
    if (!user?.uid || isLiking) return;
    
    // Store current state for potential rollback
    const previousReaction = userReaction;
    const previousReactions = { ...reactions };
    const previousLikesCount = likesCount;
    
    try {
      setIsLiking(true);
      
      // Instant optimistic update
      if (userReaction === reactionEmoji) {
        // Remove reaction if same emoji is selected
        setUserReaction(null);
        setHasLiked(false);
        setReactions(prev => ({
          ...prev,
          [reactionEmoji]: Math.max(0, (prev[reactionEmoji] || 0) - 1)
        }));
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Add new reaction or change reaction
        if (userReaction) {
          // Remove previous reaction
          setReactions(prev => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1)
          }));
        } else {
          // New reaction
          setLikesCount(prev => prev + 1);
        }
        
        // Add new reaction
        setUserReaction(reactionEmoji);
        setHasLiked(true);
        setReactions(prev => ({
          ...prev,
          [reactionEmoji]: (prev[reactionEmoji] || 0) + 1
        }));
      }
      
      // Perform the actual reaction operation
      await PostService.toggleReaction(postId, user.uid, reactionEmoji);
      
      // Server operation successful - now handle XP and notifications
      if (postUserId !== user.uid && userReaction !== reactionEmoji) {
        try {
          if (reactionEmoji !== userReaction) {
            // User just reacted to the post
            console.log('🎯 Reaction successful - awarding XP to post owner');
            await xpService.awardForLike(postUserId);
            
            // Send notification for the reaction
            await notificationService.createLikeNotification(user.uid, postUserId, postId);
            console.log('📱 Reaction notification sent successfully');
          }
        } catch (xpError) {
          console.warn('XP operation failed, but reaction action succeeded:', xpError);
        }
      }
      
      console.log('✅ Reaction action completed successfully');
      
    } catch (error) {
      console.error('❌ Reaction action failed:', error);
      
      // Rollback optimistic updates on error
      setUserReaction(previousReaction);
      setReactions(previousReactions);
      setHasLiked(!!previousReaction);
      setLikesCount(previousLikesCount);
      
      // Show error message to user
      Alert.alert(
        'Error', 
        'Failed to update reaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLiking(false);
      setShowReactionPicker(false);
    }
  };

  const handleLongPress = () => {
    console.log('🔥 Long press detected - showing reaction picker');
    console.log('Current showReactionPicker state:', showReactionPicker);
    setShowReactionPicker(true);
    console.log('Set showReactionPicker to true');
  };

  const handleQuickReaction = () => {
    console.log('👆 Quick tap - using default like reaction');
    handleReaction('👍');
  };

  const handlePressIn = () => {
    console.log('👇 Press in detected');
  };

  const handlePressOut = () => {
    console.log('👆 Press out detected');
  };

  const handleCommentLike = async (comment: Comment) => {
    if (!user?.uid) return;
    
    // Store current state for potential rollback
    const currentLiked = commentLikes[comment.id] || false;
    const currentCount = commentLikesCount[comment.id] || 0;
    const previousLiked = currentLiked;
    const previousCount = currentCount;
    
    try {
      // Instant optimistic update for better UX
      setCommentLikes(prev => ({ ...prev, [comment.id]: !currentLiked }));
      setCommentLikesCount(prev => ({ 
        ...prev, 
        [comment.id]: currentLiked ? currentCount - 1 : currentCount + 1 
      }));
      
      // Perform the actual comment like/unlike operation
      await PostService.toggleCommentLike(postId, comment.id, user.uid);
      
      // Server operation successful - now handle XP and notifications
      if (comment.userId !== user.uid) {
        try {
          if (!currentLiked) {
            // User just liked the comment
            console.log('🎯 Comment like successful - awarding XP to comment owner');
            await xpService.awardForCommentLike(comment.userId);
            
            // Send notification for the comment like
            await notificationService.createCommentLikeNotification(
              user.uid, 
              comment.userId, 
              postId, 
              comment.id
            );
            console.log('📱 Comment like notification sent successfully');
          } else {
            // User just unliked the comment
            console.log('🎯 Comment unlike successful - deducting XP from comment owner');
            await xpService.deductForCommentUnlike(comment.userId);
            console.log('📉 XP deducted for comment unlike');
          }
        } catch (xpError) {
          console.warn('Comment XP operation failed, but like action succeeded:', xpError);
          // XP failure shouldn't break the like functionality
        }
      }
      
      console.log('✅ Comment like action completed successfully');
      
    } catch (error) {
      console.error('❌ Comment like action failed:', error);
      
      // Rollback optimistic updates on error
      setCommentLikes(prev => ({ ...prev, [comment.id]: previousLiked }));
      setCommentLikesCount(prev => ({ 
        ...prev, 
        [comment.id]: previousCount 
      }));
      
      // Show error message to user
      Alert.alert(
        'Error', 
        'Failed to update comment like. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleReplyToComment = (comment: Comment) => {
    setReplyingToComment(comment);
    setNewComment(`@${comment.userName} `);
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowCommentMenu(null);
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user?.uid) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PostService.deleteComment(postId, comment.id);
              
              // Refresh comments list
              const updatedComments = await PostService.getComments(postId);
              setComments(updatedComments);
              
              console.log('✅ Comment deleted and list refreshed');
            } catch (error) {
              console.error('❌ Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          }
        }
      ]
    );
    setShowCommentMenu(null);
  };

  const handleSaveEditComment = async () => {
    if (!editingComment || !editCommentText.trim() || isEditingComment) return;

    try {
      setIsEditingComment(true);
      
      await PostService.editComment(postId, editingComment.id, editCommentText.trim());
      
      // Refresh comments list
      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments);
      
      setEditingComment(null);
      setEditCommentText('');
      console.log('✅ Comment edited and list refreshed');
    } catch (error) {
      console.error('❌ Error editing comment:', error);
      Alert.alert('Error', 'Failed to edit comment. Please try again.');
    } finally {
      setIsEditingComment(false);
    }
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleAddComment = async () => {
    if (!user?.uid || isCommenting) return;

    try {
      setIsCommenting(true);
      
      const userProfile = await UserService.getUserProfile(user.uid);
      if (!userProfile) {
        Alert.alert('Error', 'User profile not found');
        return;
      }

      // Validate profile completion
      const profileCheck = ProfileValidationService.canPerformAction(userProfile, 'comment_on_post');
      if (!profileCheck.allowed) {
        Alert.alert('Profile Incomplete', profileCheck.message, [
          { text: 'OK' },
          { 
            text: 'Complete Profile', 
            onPress: () => navigation.navigate('Profile')
          }
        ]);
        return;
      }

      if (!newComment.trim()) {
        Alert.alert('Error', 'Please enter a comment');
        return;
      }

      // Remove @username prefix if replying
      let cleanComment = newComment.trim();
      let replyToCommentId: string | undefined;
      let replyToUserName: string | undefined;
      
      if (replyingToComment) {
        cleanComment = cleanComment.replace(`@${replyingToComment.userName} `, '');
        replyToCommentId = replyingToComment.id;
        replyToUserName = replyingToComment.userName;
      }

      await PostService.addComment(
        postId,
        user.uid,
        userProfile.name || user.email || 'Anonymous',
        userProfile.profilePhotoUrl || '',
        cleanComment,
        replyToCommentId,
        replyToUserName
      );

      setNewComment('');
      setReplyingToComment(null);
      
      // Refresh comments list to show the new comment
      try {
        console.log(`🔄 Refreshing comments after adding new comment to post: ${postId}`);
        const updatedComments = await PostService.getComments(postId);
        console.log(`📝 Refreshed comment data:`, updatedComments.map(c => ({
          id: c.id,
          userName: c.userName,
          content: c.content,
          contentLength: c.content?.length || 0
        })));
        setComments(updatedComments);
        console.log(`✅ Comments refreshed - now showing ${updatedComments.length} comments`);
      } catch (refreshError) {
        console.warn('Failed to refresh comments after adding new comment:', refreshError);
        // Don't show error to user as the comment was still added successfully
      }
      
      // Notify post owner if not self-comment
      if (postUserId !== user.uid) {
        await notificationService.createCommentNotification(user.uid, postUserId, postId, cleanComment);
      }
      
      // Notify comment owner if replying to someone else's comment
      if (replyingToComment && replyingToComment.userId !== user.uid) {
        await notificationService.createCommentReplyNotification(
          user.uid,
          replyingToComment.userId,
          postId,
          replyingToComment.id,
          replyingToComment.content,
          cleanComment
        );
      }
      
      console.log('✅ Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleReport = async () => {
    if (!user?.uid) return;

    // Check if user has already reported this post
    const hasReported = await PostService.hasUserReportedPost(postId, user.uid);
    if (hasReported) {
      Alert.alert('Already Reported', 'You have already reported this post.');
      return;
    }

    Alert.alert(
      'Report Post',
      'Select a reason for reporting this post:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => reportPost('inappropriate') },
        { text: 'Spam', onPress: () => reportPost('spam') },
        { text: 'Harassment', onPress: () => reportPost('offensive') },
        { text: 'Other', onPress: () => reportPost('other') },
      ]
    );
  };

  const reportPost = async (reason: Report['reason']) => {
    if (!user?.uid) return;

    try {
      const userProfile = await UserService.getUserProfile(user.uid);
      if (!userProfile) {
        Alert.alert('Error', 'User profile not found');
        return;
      }

      await PostService.reportPost(
        postId,
        user.uid,
        userProfile.name || user.email || 'Anonymous',
        reason
      );

      Alert.alert('Success', 'Post reported successfully. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Error reporting post:', error);
      Alert.alert('Error', 'Failed to report post. Please try again.');
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handlePostUpdated = () => {
    setShowEditModal(false);
    onPostUpdate();
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PostService.deletePost(post.id);
              onPostUpdate();
              Alert.alert('Success', 'Post deleted successfully!');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    console.log('🖼️ PostCard: Image pressed:', {
      imageUrl,
      index,
      totalMedia: getCombinedMedia().length,
      mediaUrls: getCombinedMedia()
    });
    
    setCurrentImageIndex(index);
    setShowFullscreenImage(true);
  };

  const handleUserPress = () => {
    if (post.userId === user?.uid) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: post.userId });
    }
  };

  const getCombinedMedia = () => {
    const media = [];
    if (post.images && post.images.length > 0) {
      media.push(...post.images);
    }
    if (post.videos && post.videos.length > 0) {
      media.push(...post.videos);
    }
    return media;
  };

  const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp'];
    const lowerUrl = url.toLowerCase();
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.endsWith(ext));
    const hasVideoKeywords = lowerUrl.includes('video') ||
                            lowerUrl.includes('mp4') ||
                            lowerUrl.includes('mov') ||
                            lowerUrl.includes('avi');
    const hasVideoMimeType = lowerUrl.includes('video/');
    const isFirebaseStorageUrl = lowerUrl.includes('firebasestorage.googleapis.com') &&
                                (lowerUrl.includes('videos') || lowerUrl.includes('video'));
    const isVideoFile = hasVideoExtension || hasVideoKeywords || hasVideoMimeType || isFirebaseStorageUrl;
    
    return isVideoFile;
  };

  const renderFullscreenMedia = (media: string, index: number) => {
    if (isVideo(media)) {
      return (
        <Video
          source={{ uri: media }}
          style={styles.fullscreenImage}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          onLoadStart={() => {
            console.log(`🔄 Loading fullscreen video ${index}: ${media}`);
            setFullscreenImageLoading(prev => ({ ...prev, [index]: true }));
            setFullscreenImageErrors(prev => ({ ...prev, [index]: false }));
          }}
          onLoad={() => {
            console.log(`✅ Fullscreen video ${index} loaded successfully`);
            setFullscreenImageLoading(prev => ({ ...prev, [index]: false }));
          }}
          onError={(error) => {
            VideoErrorHandler.handleVideoError(error, media, `PostCard-Fullscreen-${index}`);
            setFullscreenImageLoading(prev => ({ ...prev, [index]: false }));
            setFullscreenImageErrors(prev => ({ ...prev, [index]: true }));
          }}
        />
      );
    }

    return (
      <Image
        source={{ 
          uri: media
        }}
        style={styles.fullscreenImage}
        resizeMode={'contain'}
        onLoadStart={() => {
          console.log(`🔄 Loading fullscreen image ${index}: ${media}`);
          setFullscreenImageLoading(prev => ({ ...prev, [index]: true }));
          setFullscreenImageErrors(prev => ({ ...prev, [index]: false }));
        }}
        onLoad={() => {
          console.log(`✅ Fullscreen image ${index} loaded successfully`);
          setFullscreenImageLoading(prev => ({ ...prev, [index]: false }));
        }}
        onError={(error) => {
          console.error(`❌ Fullscreen image ${index} failed to load:`, error);
          console.error(`Image URL: ${media}`);
          setFullscreenImageLoading(prev => ({ ...prev, [index]: false }));
          setFullscreenImageErrors(prev => ({ ...prev, [index]: true }));
          
          // Try to reload the image after a delay
          setTimeout(() => {
            setFullscreenImageErrors(prev => ({ ...prev, [index]: false }));
            setFullscreenImageLoading(prev => ({ ...prev, [index]: true }));
          }, 2000);
        }}
      />
    );
  };

  const renderFullscreenImage = () => (
    <Modal
      visible={showFullscreenImage}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFullscreenImage(false)}
    >
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={() => setShowFullscreenImage(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.fullscreenScrollView}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
        >
          {getCombinedMedia().map((media, index) => (
            <View key={index} style={styles.fullscreenImageContainer}>
              {renderFullscreenMedia(media, index)}
              
              {/* Loading Overlay */}
              {fullscreenImageLoading[index] && (
                <View style={styles.fullscreenLoadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.fullscreenLoadingText}>
                    Loading {isVideo(media) ? 'video' : 'image'}...
                  </Text>
                </View>
              )}
              
              {/* Error Overlay */}
              {fullscreenImageErrors[index] && (
                <TouchableOpacity 
                  style={styles.fullscreenErrorOverlay}
                  onPress={() => setShowFullscreenImage(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={isVideo(media) ? "videocam-outline" : "image-outline"} 
                    size={48} 
                    color="white" 
                  />
                  <Text style={styles.fullscreenErrorText}>
                    Failed to load {isVideo(media) ? 'video' : 'image'}
                  </Text>
                  <Text style={styles.fullscreenErrorSubtext}>Tap to close</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
        
        {getCombinedMedia().length > 1 && (
          <View style={styles.fullscreenIndicators}>
            {getCombinedMedia().map((_, index) => (
              <View
                key={index}
                style={[
                  styles.fullscreenIndicator,
                  index === currentImageIndex && styles.fullscreenIndicatorActive
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  const handleAvatarError = (error: any) => {
    console.error(`❌ PostCard userAvatar error for post ${post.id}:`, error);
    console.error(`🔍 User avatar URL: ${post.userAvatar}`);
    console.error(`🔍 User profile image: ${userProfile?.profileImage}`);
    setAvatarError(true);
    ImageUtils.getImageErrorHandler('PostCard-userAvatar')(error);
  };

  const handleAvatarLoad = () => {
    console.log(`✅ PostCard userAvatar loaded for post ${post.id}: ${post.userAvatar || userProfile?.profilePhotoUrl}`);
    setAvatarError(false);
    ImageUtils.getImageSuccessHandler('PostCard-userAvatar')();
  };

  const getAvatarSource = () => {
    if (avatarError) {
      return { uri: 'https://via.placeholder.com/40x40/007AFF/FFFFFF?text=U' };
    }
    
    const avatarUrl = post.userAvatar || userProfile?.profilePhotoUrl || '';
    return ImageUtils.getImageSource(avatarUrl, { cache: 'force-cache' });
  };

  const handleShare = async () => {
    try {
      // Assuming there is a share handler
      if (user?.uid) {
        await xpService.awardForShare(user.uid);
      }
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  return (
    <View style={[styles.container, isInProfile && styles.profileContainer, { 
      backgroundColor: colors.surface,
      borderWidth: 0, // Remove border to eliminate any visual gaps
      borderColor: colors.borderLight,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }]}>
      {/* User Profile Section */}
      {showUserProfile && (
      <TouchableOpacity style={styles.userInfo} onPress={handleUserPress} activeOpacity={0.7}>
        <Avatar
          size="medium"
          source={post.userAvatar || userProfile?.profilePhotoUrl}
          fallback={(post.userName || userProfile?.name || 'U').charAt(0).toUpperCase()}
          verified={userVerifiedBadge !== 'none'}
        />
        <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.userName, { 
                color: colors.text,
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }]}>{post.userName || userProfile?.name || 'Unknown User'}</Text>
            </View>
            <Text style={[styles.userCollege, { 
              color: colors.textSecondary,
              textShadowColor: 'rgba(255, 255, 255, 0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 1,
            }]}>{post.userCollege || userProfile?.college || ''}</Text>
          <Text style={[styles.timestamp, { 
            color: colors.textTertiary,
            textShadowColor: 'rgba(255, 255, 255, 0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 1,
          }]}>
              {formatTimestamp(post.createdAt)}
              {post.isEdited && ' • Edited'}
          </Text>
        </View>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          </TouchableOpacity>
        )}

      {/* Report Warning Indicator */}
      {reportCount >= 3 && (
        <View style={styles.reportWarning}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.reportWarningText}>
            This post has {reportCount} reports
          </Text>
        </View>
      )}

      {/* Post Content */}
      <View style={styles.content}>
        {post.content && (
          <PostTextComponent
            content={post.content}
            maxLines={3}
            maxCharacters={120}
            style={styles.postContent}
            onHashtagPress={(hashtag) => {
              // Navigate to hashtag search or page
              console.log('Hashtag tapped:', hashtag);
              // You can add navigation logic here
              // navigation.navigate('HashtagSearch', { hashtag });
            }}
            onMentionPress={(mention) => {
              // Navigate to user profile
              const username = mention.substring(1); // Remove @ symbol
              console.log('Mention tapped:', username);
              
              // Find the user in the post and navigate to their profile
              // This would require additional logic to map mentions to user IDs
              // For now, we'll just log the mention
              // You can implement user lookup logic here
            }}
          />
        )}

        {/* Media with Fullscreen Support */}
        {getCombinedMedia().length > 0 && (
          <TouchableOpacity 
            style={styles.mediaContainer}
            onPress={() => handleImagePress(getCombinedMedia()[0], 0)}
            activeOpacity={0.9}
          >
          <PostImageStack 
              media={getCombinedMedia()} 
            onImagePress={handleImagePress}
          />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        {/* Like Button */}
        <TouchableOpacity 
          style={[styles.actionButton, hasLiked && styles.likedButton]} 
          onPress={handleQuickReaction}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          delayLongPress={500}
          disabled={isLiking}
          activeOpacity={0.7}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color={hasLiked ? "#007AFF" : "#666"} />
          ) : (
            <>
              <Text style={styles.reactionEmoji}>
                {userReaction || '👍'}
              </Text>
              <Text style={[styles.actionText, hasLiked && styles.likedText]}>{likesCount}</Text>
            </>
          )}
        </TouchableOpacity>


        <TouchableOpacity style={[styles.actionButton, { 
          backgroundColor: colors.glassBackground,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }]} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { 
          backgroundColor: colors.glassBackground,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }]} onPress={() => setShowChatShareModal(true)}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
        </TouchableOpacity>

      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          
          {loadingComments ? (
            <View style={styles.loadingComments}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={ImageUtils.getImageSource(
                      item.userAvatar || '',
                      { cache: 'force-cache' }
                    )}
                    style={styles.commentAvatar}
                    onError={(error) => {
                      console.error(`❌ Comment avatar error for comment ${item.id}:`, error);
                      console.error(`🔍 Comment avatar URL: ${item.userAvatar}`);
                    }}
                    defaultSource={{ uri: 'https://via.placeholder.com/30x30/007AFF/FFFFFF?text=U' }}
                    onLoad={() => {
                      console.log(`✅ Comment avatar loaded for comment ${item.id}: ${item.userAvatar}`);
                    }}
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentUserNameContainer}>
                        <Text style={styles.commentUserName}>{item.userName || 'Unknown User'}</Text>
                        {item.isEdited && (
                          <Text style={styles.editedIndicator}> • Edited</Text>
                        )}
                      </View>
                      
                      {/* Comment menu button - only show for comment author */}
                      {user?.uid === item.userId && (
                        <TouchableOpacity 
                          style={styles.commentMenuButton}
                          onPress={() => setShowCommentMenu(showCommentMenu === item.id ? null : item.id)}
                        >
                          <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Show reply indicator if this is a reply */}
                    {item.replyToUserName && (
                      <Text style={styles.replyIndicator}>
                        Replying to @{item.replyToUserName}
                      </Text>
                    )}
                    
                    {/* Comment content or edit input */}
                    {editingComment?.id === item.id ? (
                      <View style={styles.editCommentContainer}>
                        <TextInput
                          style={styles.editCommentInput}
                          value={editCommentText}
                          onChangeText={setEditCommentText}
                          multiline
                          placeholder="Edit your comment..."
                          placeholderTextColor="#999"
                          maxLength={500}
                        />
                        <View style={styles.editCommentActions}>
                          <TouchableOpacity 
                            style={styles.cancelEditButton}
                            onPress={handleCancelEditComment}
                          >
                            <Text style={styles.cancelEditText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.saveEditButton, isEditingComment && styles.saveEditButtonDisabled]}
                            onPress={handleSaveEditComment}
                            disabled={isEditingComment}
                          >
                            {isEditingComment ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Text style={styles.saveEditText}>Save</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        {/* Debug: Show raw content */}
                        {console.log(`🎨 Rendering comment content:`, { 
                          id: item.id, 
                          content: item.content, 
                          contentLength: item.content?.length || 0 
                        })}
                        
                        <Text style={styles.commentText}>
                          {item.content || '[No comment content]'}
                        </Text>
                      </>
                    )}

                    {/* Comment menu dropdown */}
                    {showCommentMenu === item.id && user?.uid === item.userId && (
                      <View style={styles.commentMenuDropdown}>
                        <TouchableOpacity 
                          style={styles.commentMenuItem}
                          onPress={() => handleEditComment(item)}
                        >
                          <Ionicons name="create-outline" size={16} color="#007AFF" />
                          <Text style={styles.commentMenuText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.commentMenuItem}
                          onPress={() => handleDeleteComment(item)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                          <Text style={[styles.commentMenuText, { color: '#FF6B6B' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <View style={styles.commentActions}>
                      <Text style={styles.commentTimestamp}>
                        {formatTimestamp(item.createdAt)}
                      </Text>
                      
                      {/* Comment like button */}
                      <TouchableOpacity 
                        style={styles.commentLikeButton}
                        onPress={() => handleCommentLike(item)}
                      >
                        <Ionicons 
                          name={commentLikes[item.id] ? "heart" : "heart-outline"} 
                          size={16} 
                    color={commentLikes[item.id] ? "#007AFF" : "#666"} 
                        />
                        <Text style={[
                          styles.commentLikeText,
                    { color: commentLikes[item.id] ? "#007AFF" : "#666" }
                        ]}>
                          {commentLikesCount[item.id] || 0}
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Reply button */}
                      <TouchableOpacity 
                        style={styles.commentReplyButton}
                        onPress={() => handleReplyToComment(item)}
                      >
                        <Ionicons name="chatbubble-outline" size={16} color="#666" />
                        <Text style={styles.commentReplyText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              style={styles.commentsList}
            />
          )}
          
          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            {replyingToComment && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>
                  Replying to @{replyingToComment.userName}
                </Text>
                <TouchableOpacity 
                  onPress={() => setReplyingToComment(null)}
                  style={styles.cancelReplyButton}
                >
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder={replyingToComment ? `Reply to @${replyingToComment.userName}...` : "Add a comment..."}
              placeholderTextColor="#999"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.addCommentButton, isCommenting && styles.addCommentButtonDisabled]} 
              onPress={handleAddComment}
              disabled={isCommenting}
            >
              {isCommenting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsModal}>
            {user?.uid === post.userId ? (
              <>
            <TouchableOpacity style={styles.optionButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.optionText}>Edit Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={handleDelete}>
                              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.optionText, { color: '#FF6B6B' }]}>Delete Post</Text>
            </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.optionButton} onPress={handleReport}>
                <Ionicons name="flag-outline" size={20} color="#FF9500" />
                <Text style={[styles.optionText, { color: '#FF9500' }]}>Report Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Post Edit Modal */}
      <PostEditModal
        visible={showEditModal}
        post={post}
        onClose={() => setShowEditModal(false)}
        onPostUpdated={handlePostUpdated}
      />

      {/* Fullscreen Image Modal */}
      {renderFullscreenImage()}

      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactionPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReactionPicker(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.reactionPickerOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log('🚫 Closing reaction picker');
            setShowReactionPicker(false);
          }}
        >
          <View style={styles.reactionPickerContainer}>
            <Text style={styles.reactionPickerTitle}>Choose your reaction</Text>
            <View style={styles.reactionPicker}>
              {REACTION_OPTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction.emoji}
                  style={[
                    styles.reactionOption,
                    userReaction === reaction.emoji && styles.selectedReaction
                  ]}
                  onPress={() => {
                    console.log('🎯 Reaction selected:', reaction.emoji, reaction.name);
                    handleReaction(reaction.emoji);
                  }}
                >
                  <Text style={styles.reactionOptionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionOptionName}>{reaction.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postContent={post.content}
        onShareComplete={() => {
          setShowShareModal(false);
          // You can add any additional logic here after sharing
        }}
      />

      {/* Chat Share Modal */}
      <ChatShareModal
        visible={showChatShareModal}
        onClose={() => setShowChatShareModal(false)}
        postId={post.id}
        postContent={post.content}
        onShareComplete={() => {
          setShowChatShareModal(false);
        }}
      />
    </View>
  );
});

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -8, // Try smaller negative margin first
    marginVertical: 8,
    borderRadius: 0,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: screenWidth + 16, // Add back the margin we're removing (8 * 2)
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden', // Prevent any content from extending beyond bounds
  },
  profileContainer: {
    marginHorizontal: 0,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userCollege: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  mediaContainer: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 60,
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  likedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  likedButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  commentsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  loadingComments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  commentsList: {
    maxHeight: 300,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUserNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  replyIndicator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commentLikeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  commentReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commentReplyText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  cancelReplyButton: {
    padding: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 12,
    maxHeight: 80,
  },
  addCommentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCommentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullscreenScrollView: {
    flex: 1,
  },
  fullscreenImageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  fullscreenImage: {
    width: width,
    height: '100%',
  },
  fullscreenLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenLoadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  fullscreenErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenErrorText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  fullscreenErrorSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  fullscreenIndicators: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  fullscreenIndicatorActive: {
    backgroundColor: 'white',
  },
  reactionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  reactionPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reactionPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  reactionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  reactionOption: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    width: '30%',
    minHeight: 80,
    backgroundColor: '#fafafa',
  },
  selectedReaction: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
    borderWidth: 3,
  },
  reactionOptionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  reactionOptionName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  reactionsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    alignItems: 'center',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  reactionEmojiSmall: {
    fontSize: 20,
    marginRight: 5,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  totalReactions: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  reactionPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  reportWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  reportWarningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  // Comment editing and menu styles
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commentUserNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editedIndicator: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  commentMenuButton: {
    padding: 4,
    borderRadius: 4,
  },
  commentMenuDropdown: {
    position: 'absolute',
    top: 25,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  commentMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentMenuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  commentsSection: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  loadingComments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    position: 'relative',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentLikeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  commentReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentReplyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  replyIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
  },
  cancelReplyButton: {
    padding: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    flex: 1,
    marginRight: 8,
  },
  addCommentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  addCommentButtonDisabled: {
    opacity: 0.6,
  },
  editCommentContainer: {
    marginTop: 8,
  },
  editCommentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelEditButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelEditText: {
    color: '#666',
    fontSize: 14,
  },
  saveEditButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    minWidth: 60,
    alignItems: 'center',
  },
  saveEditButtonDisabled: {
    opacity: 0.6,
  },
  saveEditText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PostCard; 