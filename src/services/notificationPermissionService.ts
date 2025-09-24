import { Platform, Alert } from 'react-native';
import { UserService } from './userService';

// Conditionally import expo-notifications to avoid Android issues
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not available:', error);
}

export class NotificationPermissionService {
  /**
   * Request notification permissions from the user
   * This should be called after user login, not during app initialization
   */
  static async requestNotificationPermissions(userId: string): Promise<boolean> {
    if (!Notifications) {
      console.warn('Notifications not available, skipping permission request');
      return false;
    }

    try {
      // Check if we're on a supported platform
      if (Platform.OS === 'web') {
        console.warn('Web platform not supported for push notifications');
        return false;
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        console.log('Notification permissions already granted');
        await this.registerForPushNotifications(userId);
        return true;
      }

      // Show user-friendly explanation before requesting permissions
      return new Promise((resolve) => {
        Alert.alert(
          'Enable Notifications',
          'Stay updated with likes, comments, and collaboration requests from other creators. You can change this later in settings.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => {
                console.log('User declined notification permissions');
                resolve(false);
              }
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  const { status } = await Notifications.requestPermissionsAsync();
                  
                  if (status === 'granted') {
                    console.log('Notification permissions granted by user');
                    await this.registerForPushNotifications(userId);
                    resolve(true);
                  } else {
                    console.log('Notification permissions denied by user');
                    resolve(false);
                  }
                } catch (error) {
                  console.error('Error requesting notification permissions:', error);
                  resolve(false);
                }
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error in notification permission request:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and save token to user profile
   */
  private static async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Notifications) {
      return null;
    }

    try {
      // Try to get projectId from different sources
      let projectId: string | null = null;
      
      try {
        const Constants = require('expo-constants');
        projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                    Constants?.easConfig?.projectId ||
                    Constants?.manifest?.extra?.eas?.projectId;
      } catch (error) {
        console.warn('Could not load Constants:', error);
      }

      // If still no projectId, show warning but don't block the user
      if (!projectId || projectId === 'your-project-id') {
        console.warn('Missing or invalid EAS projectId. Push notifications will be disabled.');
        return null;
      }

      console.log('Using projectId for push notifications:', projectId);

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        } catch (error) {
          console.warn('Failed to set Android notification channel:', error);
        }
      }

      // Save token to user profile
      if (token) {
        await UserService.updateUserProfile(userId, { pushToken: token });
        console.log('Push token saved to user profile');
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Check if notification permissions are granted
   */
  static async checkNotificationPermissions(): Promise<boolean> {
    if (!Notifications) {
      return false;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Open device notification settings
   */
  static async openNotificationSettings(): Promise<void> {
    if (!Notifications) {
      Alert.alert('Error', 'Notifications are not available on this device');
      return;
    }

    try {
      // For expo-notifications, we need to use the correct API
      if (Platform.OS === 'ios') {
        // On iOS, we can use the built-in settings opening
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Notification Settings',
            'To enable notifications, please go to Settings > Notifications > CreatorCircle and turn on Allow Notifications.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Notification Settings',
            'Notifications are already enabled. To change settings, go to Settings > Notifications > CreatorCircle.',
            [{ text: 'OK' }]
          );
        }
      } else if (Platform.OS === 'android') {
        // On Android, we can try to open the app settings
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Notification Settings',
            'To enable notifications, please go to Settings > Apps > CreatorCircle > Notifications and turn on Allow notifications.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Notification Settings',
            'Notifications are already enabled. To change settings, go to Settings > Apps > CreatorCircle > Notifications.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Notification Settings',
          'Please check your device settings to manage notification permissions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
      Alert.alert('Error', 'Could not open notification settings');
    }
  }
}
