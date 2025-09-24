import * as FileSystem from 'expo-file-system/legacy';

export class VideoBufferingService {
  private static cacheDir = `${FileSystem.cacheDirectory}spotlight_videos/`;
  private static readonly BUFFER_SIZE_MB = 5; // Buffer first 5MB (roughly 5-10 seconds)
  private static readonly BUFFER_SIZE_BYTES = VideoBufferingService.BUFFER_SIZE_MB * 1024 * 1024;
  
  // Ensure cache directory exists
  static async initialize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
    } catch (_error: any) {
      // Silently ignore initialization issues to avoid UX impact
      return;
    }
  }

  // Get cached video path or return original URL
  static async getCachedVideoUrl(originalUrl: string, videoId: string): Promise<string> {
    try {
      const cachedPath = `${this.cacheDir}${videoId}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      
      if (fileInfo.exists) {
        console.log(`✅ Using cached video: ${videoId}`);
        return cachedPath;
      }
      
      // Return original URL if not cached
      return originalUrl;
    } catch (_error: any) {
      // On any error just use the original URL
      return originalUrl;
    }
  }

  // Preload video buffer in background - download full video for reliability
  static async preloadVideo(originalUrl: string, videoId: string): Promise<void> {
    try {
      const cachedPath = `${this.cacheDir}${videoId}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      
      if (fileInfo.exists) {
        console.log(`✅ Video already cached: ${videoId}`);
        return;
      }

      console.log(`🔄 Preloading video: ${videoId}`);
      
      // Download full video for reliability
      const downloadResult = await FileSystem.downloadAsync(
        originalUrl,
        cachedPath,
        {
          headers: {
            'Accept': 'video/mp4,video/*',
            'User-Agent': 'CreatorCircle/1.0'
          }
        }
      );

      if (downloadResult.status === 200) {
        const downloadedFileInfo = await FileSystem.getInfoAsync(cachedPath);
        if (downloadedFileInfo.exists && downloadedFileInfo.size && downloadedFileInfo.size > 1000) {
          console.log(`✅ Video cached: ${videoId} (${downloadedFileInfo.size} bytes)`);
        } else {
          await FileSystem.deleteAsync(cachedPath);
          console.log(`⚠️ Cached video too small, deleted: ${videoId}`);
        }
      } else {
        console.log(`⚠️ Download failed: ${downloadResult.status} for ${videoId}`);
        await FileSystem.deleteAsync(cachedPath);
      }
    } catch (_error: any) {
      // Silently ignore background preload errors
      return;
    }
  }

  // Clean up old cached videos (keep last 20)
  static async cleanupCache(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      if (files.length > 20) {
        // Sort by modification time and remove oldest
        const fileInfos = await Promise.all(
          files.map(async (file) => {
            const info = await FileSystem.getInfoAsync(`${this.cacheDir}${file}`);
            return { file, mtime: info.modificationTime || 0 };
          })
        );
        
        fileInfos.sort((a, b) => a.mtime - b.mtime);
        const toDelete = fileInfos.slice(0, files.length - 20);
        
        await Promise.all(
          toDelete.map(({ file }) => 
            FileSystem.deleteAsync(`${this.cacheDir}${file}`)
          )
        );
        
        console.log(`🧹 Cleaned up ${toDelete.length} old cached videos`);
      }
    } catch (_error: any) {
      // Silently ignore cleanup errors
      return;
    }
  }

  // Get cache size
  static async getCacheSize(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${this.cacheDir}${file}`);
        if (info.exists && info.size) {
          totalSize += info.size;
        }
      }
      
      return totalSize;
    } catch (_error: any) {
      return 0;
    }
  }
}
