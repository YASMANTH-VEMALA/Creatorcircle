import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeleton from './SimpleSkeleton';
import { useTheme } from '../../contexts/ThemeContext';

interface UserCardSkeletonProps {
  showFollowButton?: boolean;
}

const UserCardSkeleton: React.FC<UserCardSkeletonProps> = ({ showFollowButton = true }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.skeletonContainer}>
        {/* Profile Image */}
        <SimpleSkeleton width={60} height={60} borderRadius={30} style={styles.profileImage} />
        
        {/* User Info */}
        <View style={styles.userInfo}>
          <SimpleSkeleton width={140} height={18} borderRadius={9} style={styles.userName} />
          <SimpleSkeleton width={100} height={14} borderRadius={7} style={styles.userDetails} />
          <SimpleSkeleton width="90%" height={14} borderRadius={7} style={styles.userBio} />
          <SimpleSkeleton width="70%" height={14} borderRadius={7} style={styles.userBio2} />
        </View>

        {/* Follow Button */}
        {showFollowButton && (
          <SimpleSkeleton width={80} height={32} borderRadius={16} style={styles.followButton} />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    width: 140,
    height: 18,
    borderRadius: 9,
    marginBottom: 6,
  },
  userDetails: {
    width: 100,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  userBio: {
    width: '90%',
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  userBio2: {
    width: '70%',
    height: 14,
    borderRadius: 7,
  },
  followButton: {
    width: 80,
    height: 32,
    borderRadius: 16,
    marginLeft: 12,
  },
});

export default UserCardSkeleton;
