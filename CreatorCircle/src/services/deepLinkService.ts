import { Linking } from 'react-native';
import { UrlService } from './urlService';

export class DeepLinkService {
  /**
   * Initialize deep linking listeners
   */
  static initialize() {
    // Handle deep links when app is already running
    Linking.addEventListener('url', this.handleDeepLink);
    
    // Handle deep links when app is opened from a closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  /**
   * Handle incoming deep links
   */
  private static handleDeepLink = (event: { url: string }) => {
    const { type, id } = UrlService.parseDeepLink(event.url);
    
    if (type && id) {
      this.navigateToPost(type, id);
    }
  };

  /**
   * Navigate to the appropriate post based on type
   */
  private static navigateToPost(type: 'post', id: string) {
    // This would integrate with your navigation system
    // For now, we'll just log the navigation
    console.log(`Navigating to ${type} post: ${id}`);
    
    // You would typically use navigation here:
    // if (type === 'post') {
    //   navigation.navigate('PostView', { postId: id });
    // }
  }

  /**
   * Generate a shareable deep link for a post
   */
  static async generateDeepLink(postId: string): Promise<string> {
    try {
      const url = await UrlService.getPostUrl(postId, false);
      return url;
    } catch (error) {
      console.error('Error generating deep link:', error);
      throw error;
    }
  }

  /**
   * Check if the app can handle a given URL
   */
  static canHandleURL(url: string): boolean {
    return url.includes('creatorcircle.app') || url.startsWith('creatorcircle://');
  }

  /**
   * Open a URL in the default browser
   */
  static async openInBrowser(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }

  /**
   * Cleanup listeners
   */
  static cleanup() {
    Linking.removeAllListeners('url');
  }
}
