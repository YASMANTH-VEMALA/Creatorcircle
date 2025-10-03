import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { UserService, Profile } from '../services/userService';
import { PostService } from '../services/postService';
import { UrlService } from '../services/urlService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ChatShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
  hashtags?: string[];
  onShareComplete?: () => void;
}

interface ShareUser extends Profile {
  // Simple user interface for sharing
}

const ChatShareModal: React.FC<ChatShareModalProps> = ({
  visible,
  onClose,
  postId,
  postContent,
  hashtags = [],
  onShareComplete,
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ShareUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (visible && user?.uid) {
      loadAllUsers();
    }
  }, [visible, user?.uid]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadAllUsers = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Load all users from the app
      const allUsers = await UserService.getAllUsers();
      
      // Filter out current user
      const otherUsers = allUsers.filter(userProfile => userProfile.uid !== user.uid);
      
      setUsers(otherUsers);
      console.log('✅ Loaded users:', otherUsers.length);
      
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.college.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSendToSelected = async () => {
    if (selectedUsers.size === 0) return;

    setSharing(true);
    try {
      const shareUrl = await UrlService.getPostUrl(postId);
      
      let shareMessage = `📝 Check out this post!\n\n${postContent}`;
      if (hashtags && hashtags.length > 0) {
        shareMessage += `\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
      }
      shareMessage += `\n\n${shareUrl}`;

      // For now, just show success message
      // In a real app, you would send notifications or create shares here
      Alert.alert('Success', `Shared with ${selectedUsers.size} user(s)!\n\nMessage: ${shareMessage}`);
      
      setSelectedUsers(new Set());
      onShareComplete?.();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const renderUser = ({ item }: { item: ShareUser }) => {
    const isSelected = selectedUsers.has(item.uid);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => handleUserSelect(item.uid)}
      >
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.profilePhotoUrl }}
            style={styles.userAvatar}
            defaultSource={require('../../assets/icon.png')}
          />
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name}</Text>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </View>
            <Text style={styles.userCollege}>{item.college}</Text>
          </View>
        </View>
        
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.title}>
              Share Post
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Selection Info */}
          {selectedUsers.size > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                style={[styles.sendButton, sharing && styles.sendButtonDisabled]}
                onPress={handleSendToSelected}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Users List */}
          <View style={styles.contactsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : 'No users available'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'No users found in the app'
                  }
                </Text>
                <Text style={styles.debugText}>
                  Debug: Total users: {users.length}, Filtered: {filteredUsers.length}, Loading: {loading ? 'Yes' : 'No'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.uid}
                showsVerticalScrollIndicator={false}
                style={styles.contactsList}
              />
            )}
          </View>
        </View>
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
    maxHeight: screenHeight * 0.8,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  contactsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  contactCollege: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  selectedUserItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  userCollege: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChatShareModal;
