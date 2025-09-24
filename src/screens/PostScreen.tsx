import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PostCreationModal from '../components/PostCreationModal';
import { SpotlightService } from '../services/spotlightService';
import { useAuth } from '../contexts/AuthContext';

const PostScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadingSpotlight, setUploadingSpotlight] = useState(false);

  const handlePostCreated = () => {
    // Posts will automatically update via real-time subscription
    console.log('Post created successfully');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    // Navigate back or show a different view
  };

  const handleCreateSpotlight = () => {
    navigation.navigate('CreateSpotlight' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Post</Text>
        <Text style={styles.subtitle}>Share your creativity with the community</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={56} color="#007AFF" />
          <Text style={styles.createButtonText}>Create New Post</Text>
          <Text style={styles.createButtonSubtext}>
            Share text, emojis, photos, or videos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.createButton, styles.spotlightButton]} 
          onPress={handleCreateSpotlight}
          disabled={uploadingSpotlight}
        >
          <Ionicons name="flash" size={56} color="#FF6B35" />
          <Text style={styles.createButtonText}>
            {uploadingSpotlight ? 'Uploading...' : 'Create Spotlight'}
          </Text>
          <Text style={styles.createButtonSubtext}>
            Share short videos up to 60 seconds
          </Text>
        </TouchableOpacity>

      </View>

      {/* Post Creation Modal */}
      <PostCreationModal
        visible={showCreateModal}
        onClose={handleCloseModal}
        onPostCreated={handlePostCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    maxWidth: 320,
  },
  createButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  createButtonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  spotlightButton: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
});

export default PostScreen; 