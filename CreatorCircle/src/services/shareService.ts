import { Alert, Linking, Share } from 'react-native';
import { SpotlightPost } from '../types';

export class ShareService {
  // Generate shareable URL for spotlight post
  static generateSpotlightUrl(spotlightId: string): string {
    return `https://creatorcircle.app/spotlight/${spotlightId}`;
  }

  // Share spotlight to specific user (via chat)
  static async shareToUser(spotlightPost: SpotlightPost, targetUserId: string): Promise<void> {
    try {
      const shareUrl = this.generateSpotlightUrl(spotlightPost.id);
      const message = `Check out this spotlight by @${spotlightPost.creatorName}!\n\n${spotlightPost.caption || ''}\n\n${shareUrl}`;
      
      // TODO: Implement actual chat integration
      // For now, just log the share action
      console.log(`Sharing to user ${targetUserId}:`, {
        spotlightId: spotlightPost.id,
        message,
        thumbnailUrl: spotlightPost.thumbnailUrl,
        shareUrl
      });
      
      // Show success message
      Alert.alert('Shared!', `Spotlight shared to user successfully`);
    } catch (error) {
      console.error('Error sharing spotlight:', error);
      Alert.alert('Error', 'Failed to share spotlight');
    }
  }

  // Share spotlight via native share sheet
  static async shareViaNative(spotlightPost: SpotlightPost): Promise<void> {
    try {
      const shareUrl = this.generateSpotlightUrl(spotlightPost.id);
      const message = `Check out this spotlight by @${spotlightPost.creatorName}!\n\n${spotlightPost.caption || ''}\n\n${shareUrl}`;
      
      await Share.share({
        message,
        url: shareUrl,
        title: `Spotlight by @${spotlightPost.creatorName}`
      });
    } catch (error) {
      console.error('Error sharing via native share:', error);
    }
  }

  // Handle deep link navigation to spotlight
  static async handleSpotlightDeepLink(url: string): Promise<string | null> {
    try {
      // Extract spotlight ID from URL
      const spotlightIdMatch = url.match(/\/spotlight\/([a-zA-Z0-9-_]+)/);
      if (spotlightIdMatch) {
        const spotlightId = spotlightIdMatch[1];
        console.log('Navigating to spotlight:', spotlightId);
        return spotlightId;
      }
      return null;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return null;
    }
  }

  // Open spotlight in app
  static async openSpotlight(spotlightId: string): Promise<void> {
    try {
      // TODO: Navigate to spotlight screen with specific video
      console.log('Opening spotlight:', spotlightId);
      // This would typically use navigation to go to the spotlight screen
      // and scroll to the specific video
    } catch (error) {
      console.error('Error opening spotlight:', error);
    }
  }
}
