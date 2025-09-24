# Video Upload Debug Guide

## Current Issue
The video upload is failing, causing spotlight posts to be created with local file URLs instead of Firebase Storage URLs. This results in iOS SDK 54 errors when trying to play the videos.

## Debug Steps

### 1. **Test Video Upload Process**
I've added a debug button to the CreateSpotlightScreen that will only show in development mode (`__DEV__`).

**Steps:**
1. Go to Create Spotlight screen
2. Select a video from gallery or record one
3. You'll see a "Test Upload" button (only in development)
4. Tap it to test the upload process step by step
5. Check console logs for detailed information

### 2. **Check Console Logs**
Look for these specific log messages:

**Expected Success Flow:**
```
🎬 Starting video upload...
📁 Source video URI: file:///...
👤 User ID: your-user-id
📝 Post ID: spotlight_1234567890_abc123
🔍 Step 1: Validating video...
✅ Validation result: { isValid: true }
📊 Step 2: Getting video info...
✅ Video info: { size: 1234567, format: 'mov', isValid: true }
🔗 Step 3: Testing Firebase connection...
✅ Firebase connected: true
⬆️ Step 4: Uploading video...
📊 Upload progress: { progress: 10, status: 'processing', message: '...' }
✅ Upload successful!
🔗 Download URL: https://firebasestorage.googleapis.com/...
```

**Common Error Patterns:**
```
❌ Validation result: { isValid: false, error: 'Video file does not exist' }
❌ Firebase connected: false
❌ Video upload failed: [Error details]
```

### 3. **Manual Testing Commands**

You can also test the upload process manually by adding this to any component:

```typescript
import { VideoUploadTest } from '../utils/videoUploadTest';

// Test with a specific video URI
const testUpload = async () => {
  const videoUri = 'file:///your/video/path.mov';
  const userId = 'your-user-id';
  await VideoUploadTest.testVideoUpload(videoUri, userId);
};

// Test with the problematic video from your logs
const testProblematicVideo = async () => {
  await VideoUploadTest.testProblematicVideo();
};
```

### 4. **Common Issues & Solutions**

#### **Issue 1: File Not Found**
**Error:** `Video file does not exist`
**Cause:** The local file URI is invalid or the file has been moved/deleted
**Solution:** 
- Ensure the video was selected properly
- Check if the file still exists at the given path
- Try selecting a different video

#### **Issue 2: Firebase Connection Failed**
**Error:** `Firebase connected: false`
**Cause:** Firebase Storage is not properly configured or accessible
**Solution:**
- Check Firebase project configuration
- Verify Firebase Storage rules
- Check internet connection
- Ensure Firebase Storage is enabled

#### **Issue 3: Upload Permission Denied**
**Error:** `Permission denied` or `Unauthorized`
**Cause:** Firebase Storage rules don't allow the upload
**Solution:**
- Check Firebase Storage rules in Firebase Console
- Ensure rules allow authenticated users to upload
- Verify user is properly authenticated

#### **Issue 4: File Too Large**
**Error:** `Video file is too large`
**Cause:** Video exceeds 100MB limit
**Solution:**
- Compress the video before upload
- Choose a shorter video
- Reduce video quality

#### **Issue 5: Invalid Video Format**
**Error:** `Unsupported video format`
**Cause:** Video format is not supported
**Solution:**
- Use supported formats: MP4, MOV, AVI, MKV, WebM, 3GP
- Convert video to supported format

### 5. **Firebase Storage Rules Check**

Your current rules look correct, but verify they match this exactly:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. **Debug Information Collection**

When reporting issues, include:

1. **Console Logs:** Full console output from the upload test
2. **Video Info:** File size, format, and duration
3. **User Info:** User ID and authentication status
4. **Network Status:** Internet connection quality
5. **Device Info:** iOS version, device model
6. **Firebase Status:** Project ID and region

### 7. **Step-by-Step Troubleshooting**

1. **First, test the upload process:**
   - Use the debug button in CreateSpotlightScreen
   - Check console logs for each step

2. **If validation fails:**
   - Try a different video file
   - Check file size and format
   - Ensure file is accessible

3. **If Firebase connection fails:**
   - Check internet connection
   - Verify Firebase project settings
   - Check Firebase Storage rules

4. **If upload fails:**
   - Check Firebase Storage quota
   - Verify user permissions
   - Try with a smaller video file

5. **If everything works but videos still don't play:**
   - Check that the post is created with Firebase Storage URL
   - Verify the URL is accessible
   - Check video format compatibility

### 8. **Expected Behavior After Fix**

Once the upload works properly, you should see:

1. **Upload Progress:** Real-time progress indicator
2. **Success Message:** "Video uploaded successfully!"
3. **Firebase URL:** Video URL should start with `https://firebasestorage.googleapis.com/`
4. **Video Playback:** Videos should play without iOS SDK 54 errors
5. **Console Logs:** Clean logs without upload errors

### 9. **Next Steps**

1. **Test the upload process** using the debug button
2. **Check console logs** for specific error messages
3. **Report the results** with detailed log information
4. **Try different videos** if one fails
5. **Verify Firebase configuration** if connection fails

The debug tools will help identify exactly where the upload process is failing, allowing us to fix the specific issue.
