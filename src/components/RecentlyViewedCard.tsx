import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ViewedProfile } from '../services/searchHistoryService';
import { Avatar } from './ui/Avatar';

const { width } = Dimensions.get('window');

interface RecentlyViewedCardProps {
  profile: ViewedProfile;
  onPress: (profile: ViewedProfile) => void;
  onRemove: (userId: string) => void;
}

const RecentlyViewedCard: React.FC<RecentlyViewedCardProps> = ({
  profile,
  onPress,
  onRemove,
}) => {
  const formatTimeAgo = (viewedAt: any) => {
    const now = new Date();
    let viewedDate: Date;
    
    // Handle Firestore timestamp
    if (viewedAt && typeof viewedAt.toDate === 'function') {
      viewedDate = viewedAt.toDate();
    } else if (viewedAt instanceof Date) {
      viewedDate = viewedAt;
    } else if (viewedAt && typeof viewedAt === 'object' && viewedAt.seconds) {
      // Handle Firestore timestamp object
      viewedDate = new Date(viewedAt.seconds * 1000);
    } else {
      // Fallback to current time if invalid
      viewedDate = new Date();
    }
    
    const diffInMinutes = Math.floor((now.getTime() - viewedDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(profile)}
      activeOpacity={0.9}
    >
      <View style={styles.glassContainer}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.6)',
            'rgba(255, 255, 255, 0.4)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.1)'
          ]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BlurView intensity={60} style={styles.blurContainer}>
            <View style={styles.content}>
              <View style={styles.avatarContainer}>
                <Avatar
                  size="medium"
                  source={profile.profilePhotoUrl}
                  fallback={profile.name.charAt(0).toUpperCase()}
                  verified={false}
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.name}
                </Text>
                <Text style={styles.college} numberOfLines={1}>
                  {profile.college}
                </Text>
                <Text style={styles.timeAgo}>
                  {formatTimeAgo(profile.viewedAt)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(profile.userId)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="rgba(0, 0, 0, 0.7)" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.min(width - 64, 250),
    marginRight: 14,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  glassContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  gradientOverlay: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  college: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  removeButton: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
  },
});

export default RecentlyViewedCard; 