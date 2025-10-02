import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Platform } from 'react-native';

export class ProfileImageService {
  /**
   * Upload a general image to Firebase Storage
   */
  static async uploadImage(uri: string, folder: string): Promise<string> {
    try {
      console.log(`📤 Uploading image to ${folder} folder...`);
      
      // Validate URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid or missing image URI');
      }
      
      // Convert URI to blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Invalid or empty image blob');
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = uri && uri.includes('.') ? uri.split('.').pop() || 'jpg' : 'jpg';
      const fileName = `image_${timestamp}.${fileExtension}`;
      const storagePath = `${folder}/${fileName}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);
      
      // Get public download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`✅ Image uploaded successfully to ${folder}: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      console.error(`❌ Error uploading image to ${folder}:`, error);
      throw error;
    }
  }

  /**
   * Upload a single profile image to Firebase Storage
   */
  static async uploadProfileImage(uri: string, userId: string, type: 'profile' | 'banner' | 'postImage'): Promise<string> {
    try {
      console.log(`📤 Uploading ${type} image for user ${userId}...`);
      console.log(`🔍 URI details:`, {
        uri: uri.substring(0, 100) + (uri.length > 100 ? '...' : ''),
        isLocal: uri.startsWith('file://') || uri.startsWith('/'),
        isHttp: uri.startsWith('http'),
        length: uri.length
      });
      
      // Validate URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid or missing image URI');
      }
      
      if (uri.trim() === '' || uri === 'undefined' || uri === 'null') {
        throw new Error('Empty or invalid URI provided');
      }
      
      // Convert URI to blob
      console.log(`🔄 Fetching image from URI...`);
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Invalid or empty image blob');
      }
      
      // Check file size (Firebase Storage has limits)
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (blob.size > maxSize) {
        throw new Error(`File too large: ${(blob.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed: 10MB`);
      }
      
      console.log(`📊 Image blob details:`, {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2),
        isValidSize: blob.size <= maxSize
      });
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = uri && uri.includes('.') ? uri.split('.').pop() || 'jpg' : 'jpg';
      const fileName = `${type}_${userId}_${timestamp}.${fileExtension}`;
      
      // Set storage path based on type
      let storagePath: string;
      if (type === 'postImage') {
        storagePath = `posts/${userId}/${fileName}`;
      } else {
        storagePath = `users/${userId}/${fileName}`;
      }
      
      console.log(`🔄 Uploading to Firebase Storage: ${storagePath}`);
      console.log(`🔍 Storage bucket: ${storage.app.options.storageBucket}`);
      
      // Upload to Firebase Storage with proper metadata
      const storageRef = ref(storage, storagePath);
      
      // Set proper metadata for the upload
      const metadata = {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          userId: userId,
          type: type
        }
      };
      
      console.log(`🔄 Uploading to Firebase Storage with metadata:`, {
        path: storagePath,
        contentType: metadata.contentType,
        size: blob.size
      });
      
      await uploadBytes(storageRef, blob, metadata);
      
      // Get public download URL
      console.log(`🔄 Getting download URL...`);
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`✅ ${type} image uploaded successfully: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      console.error(`❌ Error uploading ${type} image:`, {
        uri: uri.substring(0, 100) + (uri.length > 100 ? '...' : ''),
        userId,
        type,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('storage/unknown')) {
          throw new Error('Firebase Storage error: Please check your internet connection and try again. If the problem persists, the file might be too large or corrupted.');
        } else if (error.message.includes('storage/unauthorized')) {
          throw new Error('Upload failed: You are not authorized to upload files. Please log in again.');
        } else if (error.message.includes('storage/canceled')) {
          throw new Error('Upload was canceled. Please try again.');
        } else if (error.message.includes('storage/invalid-format')) {
          throw new Error('Invalid file format. Please use JPG, PNG, or other supported image formats.');
        } else if (error.message.includes('File too large')) {
          throw error; // Re-throw size errors as-is
        }
      }
      
      throw error;
    }
  }

  /**
   * Upload post media (image or video) with appropriate limits and metadata
   */
  static async uploadPostMedia(
    uri: string,
    userId: string,
    mediaType: 'image' | 'video'
  ): Promise<string> {
    try {
      console.log(`📤 Uploading post ${mediaType} for user ${userId}...`);

      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid or missing media URI');
      }

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Invalid or empty media blob');
      }

      // Size limits: images 10MB, videos 500MB (strict)
      const maxSize = mediaType === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
        throw new Error(`File too large: ${(blob.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed: ${maxMb}MB`);
      }

      console.log(`📊 ${mediaType} blob details:`, {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2)
      });

      // Filename + path
      const timestamp = Date.now();
      const rawExt = uri && uri.includes('.') ? (uri.split('.').pop() || '') : '';
      const fileExtension = rawExt ? rawExt.toLowerCase() : mediaType === 'video' ? 'mp4' : 'jpg';
      const filePrefix = mediaType === 'video' ? 'postVideo' : 'postImage';
      const fileName = `${filePrefix}_${userId}_${timestamp}.${fileExtension}`;
      const storagePath = `posts/${userId}/${fileName}`;

      console.log(`🔄 Uploading to Firebase Storage: ${storagePath}`);
      console.log(`🔍 Storage bucket: ${storage.app.options.storageBucket}`);

      const storageRef = ref(storage, storagePath);

      const metadata = {
        contentType:
          blob.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          userId: userId,
          type: mediaType,
        },
      } as const;

      await uploadBytes(storageRef, blob, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ Post ${mediaType} uploaded successfully: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      console.error(`❌ Error uploading post ${mediaType}:`, {
        uri: uri?.substring(0, 100) + (uri && uri.length > 100 ? '...' : ''),
        userId,
        mediaType,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          throw new Error('Upload failed: You are not authorized to upload files. Please log in again.');
        }
        if (error.message.includes('storage/canceled')) {
          throw new Error('Upload was canceled. Please try again.');
        }
        if (error.message.includes('storage/unknown')) {
          throw new Error('Firebase Storage error: Please check your connection and try again.');
        }
      }
      throw error;
    }
  }

  /**
   * Upload multiple profile images to Firebase Storage
   */
  static async uploadProfileImages(
    profileUri: string | null, 
    bannerUri: string | null, 
    userId: string
  ): Promise<{ profilePhotoUrl: string; bannerPhotoUrl: string }> {
    try {
      console.log(`📤 Uploading profile images for user ${userId}...`);
      
      let profilePhotoUrl = '';
      let bannerPhotoUrl = '';
      
      // Upload profile photo if provided
      if (profileUri) {
        profilePhotoUrl = await this.uploadProfileImage(profileUri, userId, 'profile');
      }
      
      // Upload banner photo if provided
      if (bannerUri) {
        bannerPhotoUrl = await this.uploadProfileImage(bannerUri, userId, 'banner');
      }
      
      console.log(`✅ Profile images uploaded successfully`);
      return { profilePhotoUrl, bannerPhotoUrl };
    } catch (error) {
      console.error('❌ Error uploading profile images:', error);
      throw error;
    }
  }

  /**
   * Check if a URL is a local file path
   */
  static isLocalFile(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    return url.startsWith('file://') || 
           url.startsWith('/var/') || 
           url.startsWith('/data/') ||
           url.startsWith('/storage/') ||
           url.includes('ImagePicker/') ||
           url.includes('Containers/Data/Application/') ||
           (url.includes('.jpeg') && !url.startsWith('http')) ||
           (url.includes('.jpg') && !url.startsWith('http')) ||
           (url.includes('.png') && !url.startsWith('http'));
  }

  /**
   * Validate and clean image URL
   */
  static validateImageUrl(url: string): string {
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      console.warn('⚠️ Empty, undefined, or null image URL provided:', url);
      return this.getDefaultImageUrl('profile');
    }

    // Handle local file paths
    if (this.isLocalFile(url)) {
      console.warn(`⚠️ Local file URL detected: ${url}`);
      return this.getDefaultImageUrl('profile');
    }
    
    // Ensure URL is properly formatted for remote URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && !this.isLocalFile(url)) {
      console.warn(`⚠️ Invalid image URL format: ${url}`);
      return this.getDefaultImageUrl('profile');
    }

    // Additional validation for common invalid URLs
    if (url.includes('undefined') || url.includes('null') || url.includes('[object Object]')) {
      console.warn(`⚠️ Invalid URL content detected: ${url}`);
      return this.getDefaultImageUrl('profile');
    }

    return url;
  }

  /**
   * Get default image URL using reliable placeholder services
   */
  static getDefaultImageUrl(type: 'profile' | 'banner' | 'postImage'): string {
    // Use more reliable placeholder services with better fallbacks
    const defaultImages = {
      profile: 'https://ui-avatars.com/api/?name=User&size=200&background=007AFF&color=FFFFFF',
      banner: 'https://ui-avatars.com/api/?name=Banner&size=400x200&background=007AFF&color=FFFFFF',
      postImage: 'https://ui-avatars.com/api/?name=Image&size=300x200&background=007AFF&color=FFFFFF'
    };
    
    return defaultImages[type] || defaultImages.profile;
  }

  /**
   * Get placeholder URL (deprecated - use getDefaultImageUrl instead)
   */
  static getPlaceholderUrl(type: 'profile' | 'banner' | 'postImage'): string {
    return this.getDefaultImageUrl(type);
  }

  /**
   * Fetch image from Firebase Storage if it's a storage reference
   */
  static async getFirebaseImageUrl(storagePath: string): Promise<string> {
    try {
      if (!storagePath.startsWith('gs://') && !storagePath.startsWith('firebase://')) {
        return storagePath; // Already a public URL
      }
      
      const storageRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error fetching Firebase image URL:', error);
      return this.getDefaultImageUrl('profile');
    }
  }
} 