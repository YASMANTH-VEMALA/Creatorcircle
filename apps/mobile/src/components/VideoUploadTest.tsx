import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ManualVideoUpload } from '../utils/manualVideoUpload';
import { useAuth } from '../contexts/AuthContext';

export const VideoUploadTest: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const pickVideo = async () => {
    try {
      setIsLoading(true);
      
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access media library is required!');
        return;
      }

      // Pick video
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        const postId = `test-${Date.now()}`;
        
        console.log('🎥 Selected video:', videoUri);
        
        // Test the upload
        await ManualVideoUpload.debugVideoUpload(videoUri, user?.uid || 'test-user', postId);
      }
    } catch (error) {
      console.error('❌ Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    } finally {
      setIsLoading(false);
    }
  };

  const testExistingVideo = () => {
    // Test with a sample video URI (replace with an actual video URI from your app)
    const sampleVideoUri = 'file:///var/mobile/Containers/Data/Application/F710C826-4F88-45EA-92C1-588AA72E5C87/Library/Caches/ExponentExperienceData/@yasmanthvemala/creatorcircle/ImagePicker/D63B0A55-23E4-4F57-8EDB-F991125601C0.mov';
    const postId = `test-${Date.now()}`;
    
    ManualVideoUpload.debugVideoUpload(sampleVideoUri, user?.uid || 'test-user', postId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Upload Test</Text>
      <Text style={styles.subtitle}>Test video upload to Firebase Storage</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={pickVideo}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Picking Video...' : 'Pick Video & Test Upload'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testExistingVideo}
      >
        <Text style={styles.buttonText}>Test Existing Video</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        This will help you test the video upload process and identify any issues.
        Check the console for detailed logs.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});
