import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  Modal,
  Slider,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserService } from '../services/userService';
import { NotificationPermissionService } from '../services/notificationPermissionService';
import { AIFeaturesSettings } from '../components/AIFeaturesSettings';
import { auth } from '../config/firebase';
import { deleteUser } from 'firebase/auth';
import { DeleteAccountUrlService } from '../utils/deleteAccountUrl';
import { TestUserCleanup } from '../utils/deleteTestUsers';
import ComingSoonModal from '../components/ComingSoonModal';
import Logo from '../components/Logo';

const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTestUserModal, setShowTestUserModal] = useState(false);
  const [testUsers, setTestUsers] = useState<any[]>([]);
  const [isLoadingTestUsers, setIsLoadingTestUsers] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      initializeSettings();
    }
  }, [user?.uid]);

  const initializeSettings = async () => {
    try {
      console.log('🔧 Initializing settings for user:', user!.uid);
      
      // Check notification permissions
      const notificationsGranted = await NotificationPermissionService.checkNotificationPermissions();
      setNotificationsEnabled(notificationsGranted);
    } catch (error) {
      console.error('❌ Failed to initialize settings:', error);
    }
  };

  const handleNotificationToggle = async () => {
    if (!user?.uid) return;

    if (notificationsEnabled) {
      // If notifications are enabled, open device settings
      await NotificationPermissionService.openNotificationSettings();
    } else {
      // If notifications are disabled, request permissions
      const granted = await NotificationPermissionService.requestNotificationPermissions(user.uid);
      setNotificationsEnabled(granted);
    }
  };


  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user?.uid || !user.email) return;

    const expectedText = `${user.email}'s Account`;
    
    if (deleteConfirmation !== expectedText) {
      Alert.alert(
        'Confirmation Mismatch',
        'Please type the exact text to confirm account deletion.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDeleting(true);
    try {
      // Delete user data from Firestore
      await UserService.deleteUserAccount(user.uid);
      
      // Delete Firebase Auth user
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
      
      // Clear local storage
      await AsyncStorage.clear();
      
      // Show success message and navigate to login
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. You will be redirected to the login page.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Force navigation to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        'Failed to delete account. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountModal(false);
      setDeleteConfirmation('');
    }
  };

  const closeDeleteAccountModal = () => {
    setShowDeleteAccountModal(false);
    setDeleteConfirmation('');
  };

  const loadTestUsers = async () => {
    setIsLoadingTestUsers(true);
    try {
      await TestUserCleanup.listAllUsers();
      // In a real app, you'd want to return the users from the function
      // For now, we'll just show the console output
      Alert.alert('Test Users', 'Check the console for a list of all users. Test users are marked with 🧪');
    } catch (error) {
      console.error('Error loading test users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoadingTestUsers(false);
    }
  };

  const deleteAllTestUsers = () => {
    Alert.alert(
      'Delete Test Users',
      'This will permanently delete all test users from the database. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Test Users',
          style: 'destructive',
          onPress: async () => {
            try {
              await TestUserCleanup.deleteAllTestUsers();
              Alert.alert('Success', 'All test users have been deleted');
            } catch (error) {
              console.error('Error deleting test users:', error);
              Alert.alert('Error', 'Failed to delete test users');
            }
          }
        }
      ]
    );
  };

  const handleGenerateDeleteUrl = () => {
    if (!user?.uid || !user.email) return;
    
    // Show options for generating delete account request
    Alert.alert(
      'Delete Account Request',
      'Choose how you would like to request account deletion:',
      [
        {
          text: 'Generate Web URL',
          onPress: () => DeleteAccountUrlService.copyDeleteAccountUrl(user.uid, user.email)
        },
        {
          text: 'Local Request',
          onPress: () => {
            const localRequest = DeleteAccountUrlService.generateLocalDeletionRequest(user.uid, user.email);
            Alert.alert(
              'Local Deletion Request',
              localRequest.instructions,
              [
                { text: 'Copy Details', onPress: () => console.log('Details copied:', localRequest) },
                { text: 'Close' }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEmailDeleteRequest = () => {
    if (!user?.uid || !user.email) return;
    DeleteAccountUrlService.openEmailRequest(user.uid, user.email);
  };

  const handleShareDeleteRequest = () => {
    if (!user?.uid || !user.email) return;
    const message = DeleteAccountUrlService.generateShareableMessage(user.uid, user.email);
    Alert.alert(
      'Delete Account Request',
      message,
      [
        { text: 'Copy Message', onPress: () => console.log('Message copied to clipboard') },
        { text: 'Close' }
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo Display */}
        <View style={styles.logoContainer}>
          <Logo size={120} />
          <Text style={[styles.logoText, { color: colors.text }]}>CreatorCircle</Text>
        </View>

        {renderSection('AI Features', (
          <AIFeaturesSettings />
        ))}

        {renderSection('Appearance', (
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => setShowComingSoonModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Theme</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Switch between light and dark appearance
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}

        {renderSection('Premium Features', (
          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>CreatorCircle Premium</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Advanced features, priority support, and exclusive content
              </Text>
            </View>
            <View style={styles.statusIndicator}>
              <Ionicons name="time-outline" size={20} color="#FF9500" />
            </View>
          </View>
        ))}

        {renderSection('Notifications', (
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified about likes, comments, and collaboration requests
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationToggle}
            >
              <Ionicons 
                name={notificationsEnabled ? "notifications" : "notifications-off"} 
                size={24} 
                color={notificationsEnabled ? "#007AFF" : "#999"} 
              />
            </TouchableOpacity>
          </View>
        ))}


        {renderSection('Privacy & Security', (
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Location Sharing</Text>
              <Text style={styles.settingDescription}>
                Control location sharing with nearby creators
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LocationSettings' as never)}
              style={styles.navigateButton}
            >
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        ))}

        {renderSection('Test User Management', (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>List All Users</Text>
                <Text style={styles.settingDescription}>
                  View all users in the database (check console for output)
                </Text>
              </View>
              <TouchableOpacity
                onPress={loadTestUsers}
                style={styles.navigateButton}
                disabled={isLoadingTestUsers}
              >
                {isLoadingTestUsers ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                  <Ionicons name="list-outline" size={20} color="#FFD700" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Delete Test Users</Text>
                <Text style={styles.settingDescription}>
                  Remove all test users from the database
                </Text>
              </View>
              <TouchableOpacity
                onPress={deleteAllTestUsers}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </>
        ))}

        {renderSection('Data & Privacy', (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Generate Delete Account URL</Text>
                <Text style={styles.settingDescription}>
                  Get a link to request account deletion
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleGenerateDeleteUrl}
                style={styles.navigateButton}
              >
                <Ionicons name="link-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email Delete Request</Text>
                <Text style={styles.settingDescription}>
                  Send a deletion request via email
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleEmailDeleteRequest}
                style={styles.navigateButton}
              >
                <Ionicons name="mail-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Share Delete Request</Text>
                <Text style={styles.settingDescription}>
                  Get a shareable deletion request message
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleShareDeleteRequest}
                style={styles.navigateButton}
              >
                <Ionicons name="share-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </>
        ))}

        {renderSection('Account', (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Profile Settings</Text>
                <Text style={styles.settingDescription}>
                  Edit your profile and preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile' as never)}
                style={styles.navigateButton}
              >
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Delete Account</Text>
                <Text style={styles.settingDescription}>
                  Permanently delete your account and all data
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </>
        ))}
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteAccountModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Confirm deletion of {user?.email}'s Account
              </Text>
              <TouchableOpacity onPress={closeDeleteAccountModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Warning Banner */}
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={styles.warningText}>This action cannot be undone.</Text>
            </View>

            {/* Description */}
            <Text style={styles.modalDescription}>
              This will permanently delete {user?.email}'s account and all of its data including:
            </Text>

            <View style={styles.deletionList}>
              <Text style={styles.deletionItem}>• All posts and content</Text>
              <Text style={styles.deletionItem}>• Profile information</Text>
              <Text style={styles.deletionItem}>• Chat messages and history</Text>
              <Text style={styles.deletionItem}>• Collaboration requests</Text>
              <Text style={styles.deletionItem}>• AI settings and preferences</Text>
            </View>

            {/* Confirmation Prompt */}
            <Text style={styles.confirmationPrompt}>
              Type <Text style={styles.confirmationText}>{user?.email}'s Account</Text> to confirm.
            </Text>

            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.confirmationInput,
                  deleteConfirmation === `${user?.email}'s Account` && styles.validConfirmationInput
                ]}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Type the account name in here"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {/* Validation Message */}
              {deleteConfirmation && deleteConfirmation !== `${user?.email}'s Account` && (
                <Text style={styles.errorMessage}>Value entered does not match</Text>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.deleteAccountButton,
                deleteConfirmation === `${user?.email}'s Account` && styles.deleteAccountButtonEnabled
              ]}
              onPress={confirmDeleteAccount}
              disabled={deleteConfirmation !== `${user?.email}'s Account` || isDeleting}
            >
              {isDeleting ? (
                <Text style={styles.deleteAccountButtonText}>Deleting...</Text>
              ) : (
                <Text style={styles.deleteAccountButtonText}>I understand, delete this account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        featureName="Dark Theme"
        description="We're working on bringing you a beautiful dark mode experience. Stay tuned for this exciting feature!"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  eyeButton: {
    padding: 8,
  },
  navigateButton: {
    padding: 8,
  },
  statusIndicator: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  apiKeyInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  validApiKeyInput: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  clearButtonText: {
    color: '#666',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  helpText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 8,
  },
  validIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  invalidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invalidText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  deleteButton: {
    padding: 8,
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  deletionList: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  deletionItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  confirmationPrompt: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  confirmationText: {
    fontWeight: '600',
    color: '#FF3B30',
  },
  confirmationInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  validConfirmationInput: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF3B30',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  deleteAccountButton: {
    backgroundColor: '#C7C7CC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountButtonEnabled: {
    backgroundColor: '#FF3B30',
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
});

export default SettingsScreen; 