export class VideoPreloadService {
  private static preloadedVideos = new Set<string>();
  private static preloadPromises = new Map<string, Promise<void>>();
  private static bufferingVideos = new Map<string, boolean>();
  private static videoSizes = new Map<string, number>();

  // Instagram-style progressive buffering: Load first 10 seconds, then continue
  static async preloadVideo(videoUrl: string, videoId: string): Promise<void> {
    if (this.preloadedVideos.has(videoId) || this.preloadPromises.has(videoId)) {
      return this.preloadPromises.get(videoId);
    }

    const promise = new Promise<void>((resolve) => {
      this.preloadVideoProgressive(videoUrl, videoId, resolve);
    });

    this.preloadPromises.set(videoId, promise);
    return promise;
  }

  private static async preloadVideoProgressive(videoUrl: string, videoId: string, resolve: () => void) {
    try {
      // Step 1: Get video size first
      const headResponse = await fetch(videoUrl, { method: 'HEAD' });
      const contentLength = headResponse.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength) : 0;
      
      if (totalSize > 0) {
        this.videoSizes.set(videoId, totalSize);
      }

      // Step 2: Load first 15 seconds (approximately 4-5MB for most videos)
      const initialChunkSize = Math.min(5 * 1024 * 1024, totalSize || 5 * 1024 * 1024); // 5MB or total size
      
      console.log(`🚀 Loading first chunk for ${videoId} (${Math.round(initialChunkSize / 1024)}KB)`);
      
      await fetch(videoUrl, {
        method: 'GET',
        headers: {
          'Range': `bytes=0-${initialChunkSize - 1}`,
          'Accept': 'video/*'
        }
      });

      console.log(`✅ First chunk loaded: ${videoId}`);
      this.preloadedVideos.add(videoId);
      resolve();

      // Step 3: Continue buffering the rest in background
      if (totalSize > initialChunkSize) {
        this.continueBuffering(videoUrl, videoId, initialChunkSize, totalSize);
      }

    } catch (error) {
      console.log(`⚠️ Failed to preload video ${videoId}:`, error.message);
      resolve(); // Don't block on errors
    }
  }

  private static async continueBuffering(videoUrl: string, videoId: string, startByte: number, totalSize: number) {
    if (this.bufferingVideos.get(videoId)) {
      return; // Already buffering
    }

    this.bufferingVideos.set(videoId, true);
    
    try {
      // Load remaining video in larger chunks for better performance
      const chunkSize = 3 * 1024 * 1024; // 3MB chunks (increased from 2MB)
      let currentByte = startByte;

      while (currentByte < totalSize && this.bufferingVideos.get(videoId)) {
        const endByte = Math.min(currentByte + chunkSize - 1, totalSize - 1);
        
        try {
          await fetch(videoUrl, {
            method: 'GET',
            headers: {
              'Range': `bytes=${currentByte}-${endByte}`,
              'Accept': 'video/*'
            }
          });

          currentByte = endByte + 1;
          const progress = Math.round((currentByte / totalSize) * 100);
          console.log(`📈 Buffering ${videoId}: ${progress}%`);
          
          // Reduced delay for faster buffering
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.log(`⚠️ Chunk buffering failed for ${videoId}, retrying...`);
          // Retry with smaller chunk on error
          const retryChunkSize = Math.min(1 * 1024 * 1024, chunkSize / 2);
          const retryEndByte = Math.min(currentByte + retryChunkSize - 1, totalSize - 1);
          
          try {
            await fetch(videoUrl, {
              method: 'GET',
              headers: {
                'Range': `bytes=${currentByte}-${retryEndByte}`,
                'Accept': 'video/*'
              }
            });
            currentByte = retryEndByte + 1;
          } catch (retryError) {
            console.log(`❌ Retry failed for ${videoId}, skipping chunk`);
            currentByte = retryEndByte + 1;
          }
        }
      }

      console.log(`🎬 Full video buffered: ${videoId}`);
    } catch (error) {
      console.log(`⚠️ Background buffering failed for ${videoId}:`, error.message);
    } finally {
      this.bufferingVideos.set(videoId, false);
    }
  }

  // Stop buffering for a specific video
  static stopBuffering(videoId: string) {
    this.bufferingVideos.set(videoId, false);
  }

  // Get buffering progress for a video
  static getBufferingProgress(videoId: string): number {
    const totalSize = this.videoSizes.get(videoId);
    if (!totalSize) return 0;
    
    // This is a simplified progress calculation
    // In a real implementation, you'd track actual bytes loaded
    return this.preloadedVideos.has(videoId) ? 100 : 0;
  }

  // Check if video is currently buffering
  static isVideoBuffering(videoId: string): boolean {
    return this.bufferingVideos.get(videoId) || false;
  }

  // Check if video is preloaded
  static isVideoPreloaded(videoId: string): boolean {
    return this.preloadedVideos.has(videoId);
  }

  // Clean up old preloaded videos
  static cleanup(keepVideoIds: string[] = []): void {
    const toDelete: string[] = [];
    
    this.preloadedVideos.forEach((videoId) => {
      if (!keepVideoIds.includes(videoId)) {
        toDelete.push(videoId);
      }
    });

    toDelete.forEach(videoId => {
      this.preloadedVideos.delete(videoId);
      this.preloadPromises.delete(videoId);
      this.bufferingVideos.set(videoId, false); // Stop buffering
      this.videoSizes.delete(videoId);
    });

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} preloaded videos`);
    }
  }

  // Preload multiple videos
  static async preloadMultipleVideos(videos: Array<{url: string, id: string}>): Promise<void> {
    const promises = videos.map(video => this.preloadVideo(video.url, video.id));
    await Promise.allSettled(promises);
  }
}
