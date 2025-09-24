import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../types';
import { UserService } from '../services/userService';
import { FollowService } from '../services/followService';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'followers' | 'following' | 'connections';
  userId: string;
  onUserPress: (userId: string, userName: string) => void;
}

const UserListModal: React.FC<UserListModalProps> = ({
  visible,
  onClose,
  type,
  userId,
  onUserPress,
}) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadUsers();
    }
  }, [visible, userId, type]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let userIds: string[] = [];
      
      switch (type) {
        case 'followers':
          userIds = await FollowService.getFollowersIds(userId);
          break;
        case 'following':
          userIds = await FollowService.getFollowingIds(userId);
          break;
        case 'connections':
          // For connections, we'll use followers for now
          // You might want to implement a separate connections system
          userIds = await FollowService.getFollowersIds(userId);
          break;
        default:
          userIds = [];
      }

      if (userIds.length > 0) {
        const userProfiles = await UserService.getUserProfilesByIds(userIds);
        setUsers(userProfiles);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      setError(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'followers':
        return 'Followers';
      case 'following':
        return 'Following';
      case 'connections':
        return 'Connections';
      default:
        return 'Users';
    }
  };

  const renderUserItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onUserPress(item.uid, item.name)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatarContainer}>
        {item.profilePhotoUrl ? (
          <Image source={{ uri: item.profilePhotoUrl }} style={styles.userAvatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.verifiedBadge && item.verifiedBadge !== 'none' && (
          <View style={styles.verifiedBadge}>
            <Ionicons 
              name="checkmark" 
              size={12} 
              color={item.verifiedBadge === 'gold' ? '#FFD700' : '#C0C0C0'} 
            />
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.userCollege} numberOfLines={1}>
          {item.college}
        </Text>
        {item.location && (
          <Text style={styles.userLocation} numberOfLines={1}>
            📍 {item.location}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading {getTitle().toLowerCase()}...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>No {getTitle().toLowerCase()} yet</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={renderUserItem}
        style={styles.userList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalContentInner}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getTitle()}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {renderContent()}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContentInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  userList: {
    maxHeight: height * 0.5,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userCollege: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  userLocation: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});

export default UserListModal;
