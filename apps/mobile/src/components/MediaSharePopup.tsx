import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface MediaSharePopupProps {
  visible: boolean;
  onClose: () => void;
  onMediaSelect: (media: { type: 'photo' | 'video' | 'link'; uri?: string; text?: string }) => void;
}

export const MediaSharePopup: React.FC<MediaSharePopupProps> = ({
  visible,
  onClose,
  onMediaSelect,
}) => {
  const [linkText, setLinkText] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your media library to share photos and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handlePhotoPicker = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Remove editing to avoid size selection
        quality: 1.0, // Full quality
      });

      if (!result.canceled && result.assets[0]) {
        onMediaSelect({
          type: 'photo',
          uri: result.assets[0].uri,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const handleVideoPicker = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Remove editing to avoid size selection
        quality: 1.0, // Full quality
      });

      if (!result.canceled && result.assets[0]) {
        onMediaSelect({
          type: 'video',
          uri: result.assets[0].uri,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your camera to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Remove editing to avoid size selection
        quality: 1.0, // Full quality
      });

      if (!result.canceled && result.assets[0]) {
        onMediaSelect({
          type: 'photo',
          uri: result.assets[0].uri,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleLinkShare = () => {
    if (linkText.trim()) {
      onMediaSelect({
        type: 'link',
        text: linkText.trim(),
      });
      setLinkText('');
      setShowLinkInput(false);
      onClose();
    } else {
      Alert.alert('Invalid Link', 'Please enter a valid link or text to share.');
    }
  };

  const handleQuickLinks = (link: string) => {
    onMediaSelect({
      type: 'link',
      text: link,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Share Media</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handlePhotoPicker}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="images" size={24} color="#007AFF" />
                </View>
                <Text style={styles.optionText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleCamera}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="camera" size={24} color="#007AFF" />
                </View>
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Videos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Videos</Text>
            <TouchableOpacity
              style={styles.fullWidthButton}
              onPress={handleVideoPicker}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="videocam" size={24} color="#FF3B30" />
              </View>
              <Text style={styles.optionText}>Choose Video from Gallery</Text>
              <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {/* Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links & Text</Text>
            
            {!showLinkInput ? (
              <TouchableOpacity
                style={styles.fullWidthButton}
                onPress={() => setShowLinkInput(true)}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="link" size={24} color="#34C759" />
                </View>
                <Text style={styles.optionText}>Share Link or Text</Text>
                <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ) : (
              <View style={styles.linkInputContainer}>
                <TextInput
                  style={styles.linkInput}
                  value={linkText}
                  onChangeText={setLinkText}
                  placeholder="Enter link or text to share..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  autoFocus
                />
                <View style={styles.linkButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowLinkInput(false);
                      setLinkText('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleLinkShare}
                  >
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Quick Links */}
            <Text style={styles.quickLinksTitle}>Quick Share</Text>
            <View style={styles.quickLinksContainer}>
              <TouchableOpacity
                style={styles.quickLinkButton}
                onPress={() => handleQuickLinks('Check this out!')}
              >
                <Text style={styles.quickLinkText}>Check this out!</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLinkButton}
                onPress={() => handleQuickLinks('Thought you might like this')}
              >
                <Text style={styles.quickLinkText}>Thought you might like this</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLinkButton}
                onPress={() => handleQuickLinks('What do you think?')}
              >
                <Text style={styles.quickLinkText}>What do you think?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    maxHeight: 500,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    minWidth: 100,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  linkInputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  linkInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  linkButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  shareButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  shareButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  quickLinksTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 12,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickLinkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  quickLinkText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default MediaSharePopup;
