import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, TextInput, Image, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { SpotlightService } from '../services/spotlightService';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { UrlService } from '../services/urlService';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

const CreateSpotlightScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [uploading, setUploading] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const videoRef = useRef<Video | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const pickVideo = async () => {
    const asset = await SpotlightService.pickVideoFromLibrary();
    if (!asset) return;
    
    // Check video duration (duration is in milliseconds)
    if (asset.duration && asset.duration > 60_000) {
      const durationInSeconds = Math.round(asset.duration / 1000);
      Alert.alert(
        'Video Too Long', 
        `Your video is ${durationInSeconds} seconds long. Spotlight videos must be 60 seconds or less. Please select a shorter video.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    setSelectedVideoUri(asset.uri);
    setVideoDuration(asset.duration ? Math.round(asset.duration / 1000) : null);
  };

  const upload = async () => {
    if (!user?.uid || !selectedVideoUri) return;
    
    setShowUploadModal(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploading(true);
    
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 30000, // 30 seconds max
      useNativeDriver: false,
    }).start();

    try {
      // Upload video with progress tracking
      setUploadStatus('uploading');
      const remoteUrl = await uploadVideoWithProgress(selectedVideoUri, user.uid);
      
      // Upload thumbnail if selected
      let thumbnailUrl: string | undefined = undefined;
      if (thumbnailUri) {
        setUploadStatus('processing');
        setUploadProgress(70);
        const response = await fetch(thumbnailUri);
        const blob = await response.blob();
        const ts = Date.now();
        const ext = (thumbnailUri.split('.').pop() || 'jpg').toLowerCase();
        const fileRef = ref(storage, `spotlight/thumbnails/${user.uid}_${ts}.${ext}`);
        await uploadBytes(fileRef, blob, { contentType: blob.type || 'image/jpeg' });
        thumbnailUrl = await getDownloadURL(fileRef);
      }

      // Create spotlight post
      setUploadProgress(85);
      const spotlightId = await SpotlightService.createSpotlightPost({ 
        userId: user.uid, 
        videoUrl: remoteUrl, 
        caption: caption.trim(),
        thumbnailUrl,
        isPublic: true 
      });

      // Generate share URL
      setUploadProgress(95);
      await UrlService.generateSpotlightUrl(spotlightId);

      setUploadProgress(100);
      setUploadStatus('complete');
      
      // Auto close after success
      setTimeout(() => {
        setShowUploadModal(false);
        navigation.goBack();
      }, 2000);
      
    } catch (e) {
      console.error(e);
      setUploadStatus('error');
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadVideoWithProgress = async (videoUri: string, userId: string): Promise<string> => {
    const response = await fetch(videoUri);
    const blob = await response.blob();
    const ts = Date.now();
    const ext = videoUri.split('.').pop() || 'mp4';
    const fileRef = ref(storage, `spotlight/videos/${userId}_${ts}.${ext}`);
    
    // Simulate progress for video upload (Firebase doesn't provide real progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 2, 60));
    }, 200);
    
    try {
      await uploadBytes(fileRef, blob, { contentType: blob.type || 'video/mp4' });
      clearInterval(progressInterval);
      setUploadProgress(60);
      return await getDownloadURL(fileRef);
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [9, 16], quality: 0.9 });
    if (!result.canceled) {
      setThumbnailUri(result.assets?.[0]?.uri || null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Spotlight</Text>

      {/* Video picker + preview */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="videocam" size={20} color="#007AFF" />
          <Text style={styles.cardTitle}>Spotlight Video</Text>
          <View style={{ flex: 1 }} />
          {selectedVideoUri ? (
            <TouchableOpacity onPress={() => setSelectedVideoUri(null)} disabled={uploading}>
              <Text style={styles.clearText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={pickVideo} disabled={uploading}>
          <Ionicons name="film-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>{selectedVideoUri ? 'Change Video' : 'Pick Video (max 60s)'}</Text>
        </TouchableOpacity>

        {selectedVideoUri ? (
          <View style={styles.videoPreviewWrap}>
            <Video
              ref={(r) => (videoRef.current = r)}
              source={{ uri: selectedVideoUri }}
              style={styles.videoPreview}
              resizeMode={ResizeMode.COVER}
              isMuted
              shouldPlay
              isLooping
            />
            <View style={styles.videoOverlayRow}>
              <TouchableOpacity style={styles.smallControl} onPress={() => videoRef.current?.setIsMutedAsync(false)}>
                <Ionicons name="volume-high" size={18} color="#fff" />
              </TouchableOpacity>
              {videoDuration && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{videoDuration}s</Text>
                </View>
              )}
              <TouchableOpacity style={styles.smallControl} onPress={() => videoRef.current?.setIsMutedAsync(true)}>
                <Ionicons name="volume-mute" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.helperText}>No video selected</Text>
        )}
      </View>

      {/* Caption */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="text" size={20} color="#007AFF" />
          <Text style={styles.cardTitle}>Caption</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Add a caption..."
          value={caption}
          onChangeText={setCaption}
          editable={!uploading}
          maxLength={2200}
          multiline
        />
      </View>

      {/* Thumbnail picker + preview */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="image" size={20} color="#007AFF" />
          <Text style={styles.cardTitle}>Cover Thumbnail (optional)</Text>
          <View style={{ flex: 1 }} />
          {thumbnailUri ? (
            <TouchableOpacity onPress={() => setThumbnailUri(null)} disabled={uploading}>
              <Text style={styles.clearText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#8E8E93' }]} onPress={pickThumbnail} disabled={uploading}>
          <Ionicons name="image" size={18} color="#fff" />
          <Text style={styles.buttonText}>{thumbnailUri ? 'Change Thumbnail' : 'Pick Thumbnail'}</Text>
        </TouchableOpacity>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnailPreview} />
        ) : (
          <Text style={styles.helperText}>No thumbnail selected</Text>
        )}
      </View>

      <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={upload} disabled={!selectedVideoUri || uploading}>
        <Ionicons name="cloud-upload" size={20} color="#fff" />
        <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Upload Spotlight'}</Text>
      </TouchableOpacity>

      {/* Instagram-style Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <View style={styles.uploadHeader}>
              <Text style={styles.uploadTitle}>Uploading Spotlight</Text>
              {uploadStatus === 'error' && (
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <Ionicons name="close" size={24} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${uploadProgress}%`],
                      })
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>

            <View style={styles.statusContainer}>
              {uploadStatus === 'uploading' && (
                <>
                  <Ionicons name="cloud-upload" size={32} color="#007AFF" />
                  <Text style={styles.statusText}>Uploading video...</Text>
                </>
              )}
              {uploadStatus === 'processing' && (
                <>
                  <Ionicons name="settings" size={32} color="#FF9500" />
                  <Text style={styles.statusText}>Processing...</Text>
                </>
              )}
              {uploadStatus === 'complete' && (
                <>
                  <Ionicons name="checkmark-circle" size={32} color="#34C759" />
                  <Text style={styles.statusText}>Upload complete!</Text>
                </>
              )}
              {uploadStatus === 'error' && (
                <>
                  <Ionicons name="alert-circle" size={32} color="#FF3B30" />
                  <Text style={styles.statusText}>Upload failed</Text>
                </>
              )}
            </View>

            {uploadStatus === 'complete' && (
              <Text style={styles.successSubtext}>Your Spotlight is now live!</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', justifyContent: 'flex-start', padding: 24, paddingBottom: 48 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  button: { flexDirection: 'row', gap: 8, backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: { marginTop: 12, width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E5EA', minHeight: 48 },
  thumbnailPreview: { marginTop: 12, width: '100%', maxWidth: 520, aspectRatio: 9/16, borderRadius: 12, backgroundColor: '#000' },
  card: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#1C1C1E' },
  clearText: { color: '#FF3B30', fontWeight: '600' },
  helperText: { color: '#8E8E93', marginTop: 8 },
  videoPreviewWrap: { marginTop: 12, width: '100%', maxWidth: 520, aspectRatio: 9/16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  videoPreview: { width: '100%', height: '100%' },
  videoOverlayRow: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', gap: 8 },
  smallControl: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 999 },
  durationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadButton: { backgroundColor: '#34C759', marginTop: 16, alignSelf: 'stretch', maxWidth: 520, justifyContent: 'center' },
  // Upload Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  uploadModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: width * 0.85, maxWidth: 400 },
  uploadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  progressText: { textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: '600', color: '#007AFF' },
  statusContainer: { alignItems: 'center', marginBottom: 12 },
  statusText: { marginTop: 8, fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  successSubtext: { textAlign: 'center', fontSize: 14, color: '#8E8E93' },
});

export default CreateSpotlightScreen;


