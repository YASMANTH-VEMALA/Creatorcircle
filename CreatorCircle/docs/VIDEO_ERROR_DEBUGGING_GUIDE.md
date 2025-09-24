# Video Error Debugging Guide

## Overview
This guide helps you diagnose and fix video errors in the CreatorCircle app. The app now includes enhanced error handling and debugging tools to identify the root cause of video playback issues.

## Enhanced Error Handling

### What's New
1. **Detailed Error Logging**: All video components now log comprehensive error information
2. **User-Friendly Messages**: Error messages are now more specific and helpful
3. **Video Error Handler**: Centralized error handling utility for consistent error management
4. **Debug Tools**: Video debugging component to test video URLs and accessibility

### Error Information Logged
- Error message and code
- Video URL being accessed
- Error type and native event details
- Platform-specific information
- Timestamp and context

## Common Video Error Types

### 1. Network Errors
**Symptoms**: "Network error" or "Connection failed"
**Causes**: 
- Poor internet connection
- Video URL is unreachable
- Server is down

**Solutions**:
- Check internet connection
- Verify video URL is accessible
- Try again later

### 2. Format/Codec Errors
**Symptoms**: "Video format not supported" or "Codec error"
**Causes**:
- Unsupported video format
- Corrupted video file
- Incompatible codec

**Solutions**:
- Convert video to supported format (MP4, MOV)
- Re-upload the video
- Check video file integrity

### 3. Permission Errors
**Symptoms**: "Access denied" or "Permission error"
**Causes**:
- File permissions issue
- CORS policy blocking
- Authentication required

**Solutions**:
- Check file permissions
- Verify CORS settings
- Ensure proper authentication

### 4. Timeout Errors
**Symptoms**: "Video timeout" or "Loading timeout"
**Causes**:
- Slow network connection
- Large video file
- Server response delay

**Solutions**:
- Check internet speed
- Compress video file
- Try again

### 5. File Not Found Errors
**Symptoms**: "Video not found" or "404 error"
**Causes**:
- Video file deleted
- Incorrect URL
- File moved

**Solutions**:
- Verify video URL
- Re-upload video
- Check file location

## Debugging Steps

### 1. Check Console Logs
Look for detailed error information in the console:
```
❌ Video Error in SpotlightReelItem: {
  error: {...},
  videoUrl: "https://...",
  context: "SpotlightReelItem",
  timestamp: "2024-01-01T12:00:00.000Z",
  platform: "ios",
  errorMessage: "Network error",
  errorCode: "NETWORK_ERROR"
}
```

### 2. Test Video URL
Use the VideoDebugger component to test video accessibility:
- URL validity check
- Accessibility test
- Platform compatibility

### 3. Check Video Format
Ensure video is in supported format:
- **Supported**: MP4, MOV, AVI, MKV, WMV, FLV, WebM, M4V, 3GP
- **Recommended**: MP4 with H.264 codec

### 4. Verify Network Connection
- Test with different network connections
- Check if video loads in browser
- Verify server response

## Using the Video Debugger

### Integration
```tsx
import { VideoDebugger } from '../components/VideoDebugger';

// In your component
<VideoDebugger 
  videoUrl={videoUrl} 
  onClose={() => setShowDebugger(false)} 
/>
```

### Features
- URL validity testing
- Accessibility verification
- Common issues checklist
- Retry functionality

## Error Prevention

### 1. Video Upload Best Practices
- Use supported formats (MP4 recommended)
- Compress videos for faster loading
- Test videos before publishing
- Use reliable hosting services

### 2. URL Management
- Use HTTPS URLs when possible
- Avoid local file paths in production
- Implement proper error handling
- Cache video metadata

### 3. User Experience
- Show loading indicators
- Provide retry options
- Display helpful error messages
- Implement fallback content

## Troubleshooting Checklist

- [ ] Check console logs for detailed error information
- [ ] Verify video URL is accessible
- [ ] Test video format compatibility
- [ ] Check network connection
- [ ] Verify file permissions
- [ ] Test on different devices/platforms
- [ ] Check server response times
- [ ] Validate video file integrity

## Support Information

When reporting video errors, include:
1. Error message from console
2. Video URL (if not sensitive)
3. Device/platform information
4. Steps to reproduce
5. Network conditions

## Technical Details

### Error Handler Usage
```tsx
import { VideoErrorHandler } from '../utils/videoErrorHandler';

// In video component
onError={(error) => {
  VideoErrorHandler.handleVideoError(error, videoUrl, 'ComponentName');
}}
```

### Testing Video URLs
```tsx
import { VideoErrorHandler } from '../utils/videoErrorHandler';

const isAccessible = await VideoErrorHandler.testVideoUrl(videoUrl);
```

This enhanced error handling system will help you quickly identify and resolve video playback issues in your app.
