import { Platform, Alert } from 'react-native';

export interface VideoErrorInfo {
  error: any;
  videoUrl: string;
  context: string;
  timestamp: string;
  platform: string;
  errorMessage?: string;
  errorCode?: string;
  errorType?: string;
  nativeEvent?: any;
  target?: any;
}

export class VideoErrorHandler {
  /**
   * Handle video errors with detailed logging and user-friendly messages
   */
  static handleVideoError(error: any, videoUrl: string, context: string): void {
    const errorInfo: VideoErrorInfo = {
      error,
      videoUrl,
      context,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorType: error?.type,
      nativeEvent: error?.nativeEvent,
      target: error?.target
    };

    // Log detailed error information
    console.error(`❌ Video Error in ${context}:`, errorInfo);
    console.error(`📹 Video URL: ${videoUrl}`);
    console.error(`🔍 Error Object:`, error);
    
    // Log specific error patterns
    this.logSpecificErrors(errorInfo);
    
    // Show user-friendly error message
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    Alert.alert('Video Error', userMessage);
  }

  /**
   * Log specific error patterns for debugging
   */
  private static logSpecificErrors(errorInfo: VideoErrorInfo): void {
    const { error, videoUrl, context } = errorInfo;
    
    // Check for iOS AVFoundation specific errors
    if (error?.message?.includes('-11800') || error?.message?.includes('AVFoundationErrorDomain')) {
      console.error('🍎 iOS AVFoundation Error -11800: Video codec/format issue');
      console.error('💡 Solution: Upload video to Firebase Storage instead of using local file URLs');
      console.error('🔧 This error commonly occurs with local file URLs in iOS SDK 54+');
    }
    
    if (error?.message?.includes('-17913')) {
      console.error('🍎 iOS AVPlayer Error -17913: AVPlayerItem failed');
      console.error('💡 Solution: Use Firebase Storage URLs instead of local file paths');
    }
    
    // Check for local file URL issues
    if (videoUrl?.startsWith('file://')) {
      console.error('📁 Local file URL detected - this may cause issues in iOS SDK 54+');
      console.error('💡 Solution: Upload to Firebase Storage and use the download URL');
      console.error('🔧 Local file URLs have restricted access in newer iOS versions');
    }
    
    // Check for common error patterns
    if (error?.message?.includes('network')) {
      console.error('🌐 Network error detected - check internet connection');
    }
    
    if (error?.message?.includes('format') || error?.message?.includes('codec')) {
      console.error('🎬 Video format/codec error - unsupported video format');
    }
    
    if (error?.message?.includes('permission') || error?.message?.includes('access')) {
      console.error('🔒 Permission error - check file access permissions');
    }
    
    if (error?.message?.includes('timeout')) {
      console.error('⏰ Timeout error - video took too long to load');
    }
    
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      console.error('📁 File not found - video URL may be invalid or expired');
    }
    
    if (error?.message?.includes('CORS') || error?.message?.includes('cross-origin')) {
      console.error('🚫 CORS error - cross-origin video access denied');
    }
    
    // Check video URL validity
    if (!videoUrl || videoUrl.trim() === '') {
      console.error('🚨 Empty video URL provided');
    } else if (!this.isValidVideoUrl(videoUrl)) {
      console.error('🚨 Invalid video URL format:', videoUrl);
    }
    
    // Platform-specific errors
    if (Platform.OS === 'android') {
      console.error('🤖 Android-specific video error - check hardware acceleration');
    } else if (Platform.OS === 'ios') {
      console.error('🍎 iOS-specific video error - check AVPlayer configuration');
    }
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(errorInfo: VideoErrorInfo): string {
    const { error, videoUrl } = errorInfo;
    
    // Check for iOS AVFoundation specific errors
    if (error?.message?.includes('-11800') || error?.message?.includes('AVFoundationErrorDomain')) {
      return 'Video format issue: This video cannot be played. Please try uploading it again or use a different video format.';
    }
    
    if (error?.message?.includes('-17913')) {
      return 'Video playback failed: Please try uploading the video again or use a different video.';
    }
    
    // Check for local file URL issues
    if (videoUrl?.startsWith('file://')) {
      return 'Video access issue: Please upload the video again. Local video files cannot be played in this version.';
    }
    
    // Check for specific error messages
    if (error?.message) {
      if (error.message.includes('network') || error.message.includes('connection')) {
        return 'Network error: Please check your internet connection and try again.';
      }
      
      if (error.message.includes('format') || error.message.includes('codec')) {
        return 'Video format not supported: This video format cannot be played on your device.';
      }
      
      if (error.message.includes('permission') || error.message.includes('access')) {
        return 'Access denied: Unable to access the video file.';
      }
      
      if (error.message.includes('timeout')) {
        return 'Video timeout: The video took too long to load. Please try again.';
      }
      
      if (error.message.includes('404') || error.message.includes('not found')) {
        return 'Video not found: The video file may have been moved or deleted.';
      }
      
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        return 'Video access denied: Unable to load video from this source.';
      }
      
      // Return the actual error message if it's user-friendly
      return `Video Error: ${error.message}`;
    }
    
    // Check for error codes
    if (error?.code) {
      return `Video Error Code: ${error.code}`;
    }
    
    // Check for native event errors
    if (error?.nativeEvent?.error) {
      return `Video Error: ${error.nativeEvent.error}`;
    }
    
    // Default fallback
    return 'An unknown video error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Validate video URL format
   */
  private static isValidVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // Check for common video URL patterns
    const videoUrlPatterns = [
      /^https?:\/\/.+/i,  // HTTP/HTTPS URLs
      /^file:\/\/.+/i,     // File URLs
      /^content:\/\/.+/i,  // Content URLs
      /^asset:\/\/.+/i,    // Asset URLs
    ];
    
    return videoUrlPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Test video URL accessibility
   */
  static async testVideoUrl(videoUrl: string): Promise<boolean> {
    try {
      if (!this.isValidVideoUrl(videoUrl)) {
        console.error('❌ Invalid video URL format:', videoUrl);
        return false;
      }
      
      // For HTTP/HTTPS URLs, test with a HEAD request
      if (videoUrl.startsWith('http')) {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error('❌ Video URL not accessible:', response.status, response.statusText);
          return false;
        }
        console.log('✅ Video URL is accessible');
        return true;
      }
      
      // For local files, assume they're accessible
      console.log('✅ Local video file URL');
      return true;
    } catch (error) {
      console.error('❌ Error testing video URL:', error);
      return false;
    }
  }

  /**
   * Get video error summary for debugging
   */
  static getErrorSummary(errorInfo: VideoErrorInfo): string {
    const { error, videoUrl, context, timestamp } = errorInfo;
    
    return `
Video Error Summary:
- Context: ${context}
- Time: ${timestamp}
- Platform: ${Platform.OS}
- Video URL: ${videoUrl}
- Error Message: ${error?.message || 'No message'}
- Error Code: ${error?.code || 'No code'}
- Error Type: ${error?.type || 'No type'}
- Native Event: ${error?.nativeEvent ? JSON.stringify(error.nativeEvent) : 'None'}
    `.trim();
  }
}
