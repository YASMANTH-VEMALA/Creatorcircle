import { Platform } from 'react-native';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Image } from 'react-native';

export interface ImageSource {
  uri: string;
  cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached';
  headers?: { [key: string]: string };
}

export class ImageUtils {
  /**
   * Check if a URI is a local file path
   */
  static isLocalFile(uri: string): boolean {
    return uri.startsWith('file://') || 
           uri.startsWith('/var/') || 
           uri.startsWith('/data/') ||
           uri.startsWith('/storage/') ||
           !uri.startsWith('http');
  }

  /**
   * Check if a URI is a Firebase Storage URL
   */
  static isFirebaseStorageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    return url.includes('firebasestorage.googleapis.com') || 
           url.includes('firebaseapp.com');
  }

  /**
   * Get optimized image source for the current platform
   */
  static getImageSource(uri: string, options?: {
    cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached';
    headers?: { [key: string]: string };
  }): ImageSource {
    // Handle empty, undefined, or invalid URIs
    if (!uri || uri.trim() === '' || uri === 'undefined' || uri === 'null') {
      console.warn('⚠️ Empty, undefined, or invalid image URI provided:', uri);
      return {
        uri: 'https://ui-avatars.com/api/?name=IMG&size=100&background=007AFF&color=FFFFFF',
        cache: 'default'
      };
    }

    // Handle local file paths (common Android issue)
    if (this.isLocalFile(uri)) {
      console.log(`📁 Local file detected: ${uri}`);
      
      // For Android, local files might not be accessible
      if (Platform.OS === 'android') {
        console.warn(`⚠️ Local file on Android may not be accessible: ${uri}`);
        // Return a placeholder for local files on Android
        return {
          uri: 'https://ui-avatars.com/api/?name=LOCAL&size=100&background=007AFF&color=FFFFFF',
          cache: 'default'
        };
      }
    }

    const defaultOptions = {
      cache: Platform.OS === 'android' ? 'force-cache' : 'default' as const,
      headers: Platform.OS === 'android' ? {
        'Cache-Control': 'max-age=31536000',
        'User-Agent': 'CreatorCircle/1.0'
      } : undefined
    };

    return {
      uri: this.normalizePlaceholder(this.validateImageUrl(uri)),
      cache: options?.cache || defaultOptions.cache,
      headers: options?.headers || defaultOptions.headers
    };
  }

  /**
   * Get Firebase Storage download URL with error handling
   */
  static async getFirebaseImageUrl(path: string): Promise<string | null> {
    try {
      console.log(`🖼️ Getting Firebase Storage URL for: ${path}`);
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      console.log(`✅ Firebase Storage URL obtained: ${url}`);
      return url;
    } catch (error) {
      console.error(`❌ Error getting Firebase Storage URL for ${path}:`, error);
      return null;
    }
  }

  /**
   * Validate image URL and return fallback if needed
   */
  static validateImageUrl(url: string): string {
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      console.warn('⚠️ Empty, undefined, or null image URL provided:', url);
      return this.getDefaultImageUrl('profile');
    }

    // Handle local file paths
    if (this.isLocalFile(url)) {
      console.warn(`⚠️ Local file URL detected: ${url}`);
      if (Platform.OS === 'android') {
        return this.getDefaultImageUrl('profile');
      }
      // For iOS, we can try to keep it, but it might not work
      return url;
    }
    
    // Ensure URL is properly formatted for remote URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && !this.isLocalFile(url)) {
      console.warn(`⚠️ Invalid image URL format: ${url}`);
      return this.getDefaultImageUrl('profile');
    }

    // Add platform-specific URL modifications if needed
    if (Platform.OS === 'android') {
      // Android-specific URL handling
      if (url.includes('firebasestorage.googleapis.com')) {
        // Ensure Firebase Storage URLs work on Android
        return url;
      }
    }

    return this.normalizePlaceholder(url);
  }

  /**
   * Normalize placeholder domains to reliable provider
   */
  static normalizePlaceholder(url: string): string {
    if (!url) return this.getDefaultImageUrl('profile');
    const lower = url.toLowerCase();
    if (lower.includes('via.placeholder.com')) {
      // Attempt to parse dimensions if present, default to 400x200 for banners
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        const path = u.pathname.replace(/^\//, '');
        const dims = path.split('/')[0];
        const size = dims && /\d+x\d+/.test(dims) ? dims : '400x200';
        return `https://placehold.co/${size}/png?text=Image`;
      } catch {
        return 'https://placehold.co/400x200/png?text=Image';
      }
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
   * Get image loading error handler with enhanced logging
   */
  static getImageErrorHandler(context: string) {
    return (error: any) => {
      const errorInfo = {
        context,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        errorMessage: error?.message || error?.nativeEvent?.error || 'Unknown error',
        errorCode: error?.code,
        target: error?.target,
        uri: error?.nativeEvent?.uri
      };
      
      console.error(`❌ Image loading error in ${context}:`, errorInfo);
      
      // Log specific local file errors
      if (errorInfo.errorMessage?.includes('ENOENT') || 
          errorInfo.errorMessage?.includes('no such file') ||
          errorInfo.errorMessage?.includes('couldn\'t be opened')) {
        console.error(`🚨 Local file error: File not found or not accessible`);
        console.error(`📁 File path: ${errorInfo.uri}`);
        console.error(`💡 Solution: Use Firebase Storage URLs instead of local file paths`);
        console.error(`🔧 Context: ${context}`);
      }
    };
  }

  /**
   * Get image loading success handler
   */
  static getImageSuccessHandler(context: string) {
    return () => {
      console.log(`✅ Image loaded successfully in ${context} (${Platform.OS})`);
    };
  }

  /**
   * Get platform-specific image cache strategy
   */
  static getCacheStrategy(): 'default' | 'reload' | 'force-cache' | 'only-if-cached' {
    if (Platform.OS === 'android') {
      return 'force-cache';
    }
    return 'default';
  }

  /**
   * Get platform-specific headers for image requests
   */
  static getImageHeaders(): { [key: string]: string } | undefined {
    if (Platform.OS === 'android') {
      return {
        'Cache-Control': 'max-age=31536000',
        'User-Agent': 'CreatorCircle/1.0',
        'Accept': 'image/*'
      };
    }
    return undefined;
  }

  /**
   * Get a safe fallback image source
   */
  static getFallbackImageSource(context: string = 'unknown'): ImageSource {
    // Use a more reliable fallback with multiple options
    const fallbackUrls = [
      'https://ui-avatars.com/api/?name=IMG&size=100&background=007AFF&color=FFFFFF',
      'https://ui-avatars.com/api/?name=IMG&size=100&background=FF6B35&color=FFFFFF',
      'https://ui-avatars.com/api/?name=IMG&size=100&background=34C759&color=FFFFFF'
    ];
    
    // Use the first fallback URL
    return {
      uri: fallbackUrls[0],
      cache: 'default'
    };
  }

  /**
   * Validate if a URL is a valid image URL
   */
  static isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl === '') {
      return false;
    }

    // Check if it's a valid URL format
    try {
      new URL(trimmedUrl);
    } catch {
      return false;
    }

    const lowerUrl = trimmedUrl.toLowerCase();
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    
    // Check for Firebase Storage URLs
    const isFirebaseStorageUrl = lowerUrl.includes('firebasestorage.googleapis.com');
    
    // Check for data URLs
    const isDataUrl = lowerUrl.startsWith('data:image/');
    
    // Check for placeholder URLs (via.placeholder.com, placeholder.com, etc.)
    const isPlaceholderUrl = lowerUrl.includes('via.placeholder.com') || 
                            lowerUrl.includes('placeholder.com') ||
                            lowerUrl.includes('picsum.photos') ||
                            lowerUrl.includes('unsplash.com') ||
                            lowerUrl.includes('loremflickr.com');
    
    return hasImageExtension || isFirebaseStorageUrl || isDataUrl || isPlaceholderUrl;
  }

  /**
   * Preload an image to check if it's accessible
   */
  static async preloadImage(url: string): Promise<boolean> {
    if (!this.isValidImageUrl(url)) {
      return false;
    }

    try {
      await Image.prefetch(url);
      return true;
    } catch (error) {
      console.error('Image preload failed:', error);
      return false;
    }
  }

  /**
   * Get a fallback image URL for failed images
   */
  static getFallbackImageUrl(): string {
    // Return a more reliable placeholder image URL
    return 'https://ui-avatars.com/api/?name=IMG&size=400x300&background=007AFF&color=FFFFFF';
  }

  /**
   * Retry loading an image with exponential backoff
   */
  static async retryImageLoad(
    url: string, 
    maxRetries: number = 3, 
    baseDelay: number = 1000
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await this.preloadImage(url);
        if (success) {
          return true;
        }
      } catch (error) {
        console.error(`Image load attempt ${attempt} failed:`, error);
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  /**
   * Clean up Firebase Storage URL (remove unnecessary parameters)
   */
  static cleanFirebaseUrl(url: string): string {
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    try {
      const urlObj = new URL(url);
      // Remove any unnecessary query parameters that might cause issues
      const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
      return cleanUrl;
    } catch {
      return url;
    }
  }

  /**
   * Check if image is accessible by attempting to preload it
   */
  static async checkImageAccessibility(url: string): Promise<boolean> {
    if (!this.isValidImageUrl(url)) {
      return false;
    }

    try {
      // Use Image.prefetch instead of fetch for better React Native compatibility
      const success = await Image.prefetch(url);
      return success;
    } catch (error) {
      console.error('Image accessibility check failed:', error);
      return false;
    }
  }

  /**
   * Debug image loading issues
   */
  static debugImageUrl(url: string, context: string = ''): void {
    console.group(`🔍 Image Debug${context ? ` (${context})` : ''}`);
    console.log('Original URL:', url);
    console.log('URL Type:', typeof url);
    console.log('URL Length:', url?.length || 0);
    console.log('Is Empty:', !url || url.trim() === '');
    console.log('Is Local File:', this.isLocalFile(url));
    console.log('Starts with HTTP:', url?.startsWith('http'));
    console.log('Contains invalid content:', url?.includes('undefined') || url?.includes('null') || url?.includes('[object Object]'));
    console.log('Validated URL:', this.validateImageUrl(url));
    console.groupEnd();
  }
} 