import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export class UrlService {
  private static readonly BASE_URL = 'https://creatorcircle.app'; // Replace with your actual domain
  private static readonly DEEP_LINK_BASE = 'creatorcircle://'; // Deep link scheme

  /**
   * Generate a unique URL for a regular post
   */
  static async generatePostUrl(postId: string): Promise<string> {
    try {
      const url = `${this.BASE_URL}/post/${postId}`;
      const deepLink = `${this.DEEP_LINK_BASE}post/${postId}`;
      
      // Update post with URL for future reference
      await updateDoc(doc(db, 'posts', postId), {
        shareUrl: url,
        deepLinkUrl: deepLink,
        lastSharedAt: serverTimestamp()
      });

      return url;
    } catch (error) {
      console.error('Error generating post URL:', error);
      throw error;
    }
  }


  /**
   * Get existing URL for a post (if already generated)
   */
  static async getPostUrl(postId: string): Promise<string> {
    try {
      const postDoc = await doc(db, 'posts', postId);
      
      // Try to get existing URL first
      const snapshot = await getDoc(postDoc);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.shareUrl) {
          return data.shareUrl;
        }
      }

      // Generate new URL if doesn't exist
      return await this.generatePostUrl(postId);
    } catch (error) {
      console.error('Error getting post URL:', error);
      throw error;
    }
  }

  /**
   * Generate share text with URL
   */
  static generateShareText(content: string, url: string): string {
    return `Check out this post on CreatorCircle:\n\n${content}\n\n${url}`;
  }


  /**
   * Parse deep link to extract post information
   */
  static parseDeepLink(url: string): { type: 'post' | null; id: string | null } {
    try {
      if (url.startsWith(this.DEEP_LINK_BASE)) {
        const path = url.replace(this.DEEP_LINK_BASE, '');
        const parts = path.split('/');
        
        if (parts.length >= 2) {
          const type = parts[0] as 'post';
          const id = parts[1];
          return { type, id };
        }
      }
      
      return { type: null, id: null };
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return { type: null, id: null };
    }
  }

  /**
   * Generate QR code data for post sharing
   */
  static generateQRCodeData(url: string): string {
    return url;
  }

  /**
   * Generate a unique URL for a spotlight post
   */
  static async generateSpotlightUrl(spotlightId: string): Promise<string> {
    try {
      const url = `${this.BASE_URL}/spotlight/${spotlightId}`;
      const deepLink = `${this.DEEP_LINK_BASE}spotlight/${spotlightId}`;
      await updateDoc(doc(db, 'spotlightPosts', spotlightId), {
        shareUrl: url,
        deepLinkUrl: deepLink,
        lastSharedAt: serverTimestamp(),
      });
      return url;
    } catch (error) {
      console.error('Error generating spotlight URL:', error);
      throw error;
    }
  }

  /**
   * Get existing URL for a spotlight post (if already generated)
   */
  static async getSpotlightUrl(spotlightId: string): Promise<string> {
    try {
      const spotlightDoc = await doc(db, 'spotlightPosts', spotlightId);
      const snapshot = await getDoc(spotlightDoc);
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        if (data.shareUrl) return data.shareUrl;
      }
      return await this.generateSpotlightUrl(spotlightId);
    } catch (error) {
      console.error('Error getting spotlight URL:', error);
      throw error;
    }
  }
}

