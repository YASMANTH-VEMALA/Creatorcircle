import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeleton from './SimpleSkeleton';
import { useTheme } from '../../contexts/ThemeContext';

interface PostCardSkeletonProps {
  showUserProfile?: boolean;
}

const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({ showUserProfile = true }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.skeletonContainer}>
        {/* User Profile Section */}
        {showUserProfile && (
          <View style={styles.userSection}>
            <SimpleSkeleton width={40} height={40} borderRadius={20} />
            <View style={styles.userInfo}>
              <SimpleSkeleton width={120} height={16} borderRadius={8} style={styles.userName} />
              <SimpleSkeleton width={80} height={12} borderRadius={6} style={styles.userDetails} />
            </View>
            <SimpleSkeleton width={24} height={24} borderRadius={12} />
          </View>
        )}

        {/* Post Content */}
        <View style={styles.contentSection}>
          <View style={styles.textContent}>
            <SimpleSkeleton width="100%" height={16} borderRadius={8} style={styles.textLine1} />
            <SimpleSkeleton width="85%" height={16} borderRadius={8} style={styles.textLine2} />
            <SimpleSkeleton width="60%" height={16} borderRadius={8} style={styles.textLine3} />
          </View>
          
          {/* Media Placeholder */}
          <View style={styles.mediaContainer}>
            <SimpleSkeleton width="100%" height={200} borderRadius={8} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <SimpleSkeleton width={24} height={24} borderRadius={12} />
          <SimpleSkeleton width={24} height={24} borderRadius={12} />
          <SimpleSkeleton width={24} height={24} borderRadius={12} />
          <SimpleSkeleton width={24} height={24} borderRadius={12} />
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <SimpleSkeleton width={60} height={14} borderRadius={7} />
          <SimpleSkeleton width={60} height={14} borderRadius={7} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonContainer: {
    padding: 0,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    width: 120,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  userDetails: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  moreButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  contentSection: {
    marginBottom: 12,
  },
  textContent: {
    marginBottom: 12,
  },
  textLine1: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  textLine2: {
    width: '85%',
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  textLine3: {
    width: '60%',
    height: 16,
    borderRadius: 8,
  },
  mediaContainer: {
    marginTop: 8,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    width: 60,
    height: 14,
    borderRadius: 7,
  },
});

export default PostCardSkeleton;
