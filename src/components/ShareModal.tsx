import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Clipboard,
  Share as RNShare,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UrlService } from '../services/urlService';
import ChatShareModal from './ChatShareModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
  hashtags?: string[];
  onShareComplete?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  postId,
  postContent,
  hashtags = [],
  onShareComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showChatShare, setShowChatShare] = useState(false);

  const handleGenerateUrl = async () => {
    if (generatedUrl) return generatedUrl;

    setIsLoading(true);
    try {
      const url = await UrlService.getPostUrl(postId, false);
      setGeneratedUrl(url);
      return url;
    } catch (error) {
      console.error('Error generating URL:', error);
      Alert.alert('Error', 'Failed to generate share URL. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = await handleGenerateUrl();
      if (url) {
        await Clipboard.setString(url);
        Alert.alert('Success', 'Link copied to clipboard!');
        onShareComplete?.();
      }
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const url = await handleGenerateUrl();
      if (!url) return;

      const shareText = UrlService.generateShareText(postContent, url, false);

      await RNShare.share({
        message: shareText,
        url: url,
        title: 'CreatorCircle Post',
      });

      onShareComplete?.();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const handleShareToChat = () => {
    // This would integrate with your chat system
    Alert.alert('Share to Chat', 'This feature will be implemented with your chat system');
  };

  const shareOptions = [
    {
      id: 'chat',
      title: 'Send to Chat',
      icon: 'chatbubble-outline',
      color: '#FF9500',
      onPress: () => setShowChatShare(true),
    },
    {
      id: 'copy',
      title: 'Copy Link',
      icon: 'copy-outline',
      color: '#007AFF',
      onPress: handleCopyLink,
    },
    {
      id: 'share',
      title: 'Share',
      icon: 'share-outline',
      color: '#34C759',
      onPress: handleShare,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content Preview */}
          <View style={styles.contentPreview}>
            <Text style={styles.contentText} numberOfLines={3}>
              {postContent}
            </Text>
            {hashtags.length > 0 && (
              <Text style={styles.hashtags}>
                {hashtags.map(tag => `#${tag}`).join(' ')}
              </Text>
            )}
          </View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.shareOption}
                onPress={option.onPress}
                disabled={isLoading}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as any} size={24} color="white" />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Generating share link...</Text>
            </View>
          )}

          {/* Generated URL Display */}
          {generatedUrl && (
            <View style={styles.urlContainer}>
              <Text style={styles.urlLabel}>Share URL:</Text>
              <Text style={styles.urlText} numberOfLines={2}>
                {generatedUrl}
              </Text>
            </View>
          )}
        </View>

        {/* Chat Share Modal */}
        <ChatShareModal
          visible={showChatShare}
          onClose={() => setShowChatShare(false)}
          postId={postId}
          postContent={postContent}
          isSpotlight={false}
          hashtags={hashtags}
          onShareComplete={() => {
            setShowChatShare(false);
            onShareComplete?.();
          }}
        />
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
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  contentPreview: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  hashtags: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  shareOption: {
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  urlContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
});

export default ShareModal;

