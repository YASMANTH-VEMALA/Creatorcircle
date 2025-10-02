import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create a profile?',
      answer: 'Go to your Profile tab, tap "Edit Profile", and fill in your information including name, college, skills, and interests. Don\'t forget to add a profile photo!',
      category: 'profile'
    },
    {
      id: '2',
      question: 'How do I find people to connect with?',
      answer: 'Use the "Suggested People" feature in the More tab. It will show you users who share similar skills or interests. You can also use the "Find People" tab to search for specific users.',
      category: 'connections'
    },
    {
      id: '3',
      category: 'features'
    },
    {
      id: '4',
      question: 'How do I follow someone?',
      answer: 'You can follow someone by tapping the "Follow" button on their profile or on their suggested people card. You\'ll then see their posts in your feed.',
      category: 'connections'
    },
    {
      id: '5',
      question: 'What are collaboration requests?',
      answer: 'Collaboration requests allow you to propose working together on projects with other creators. You can send and receive requests based on shared interests and skills.',
      category: 'collaboration'
    },
    {
      id: '6',
      question: 'How do I create a post?',
      answer: 'Tap the "+" button in the center of the bottom navigation, then add your content and tap "Post".',
      category: 'features'
    },
    {
      id: '7',
      question: 'Can I edit my posts after posting?',
      answer: 'Currently, you cannot edit posts after they\'re published. However, you can delete them and create new ones if needed.',
      category: 'features'
    },
    {
      id: '8',
      question: 'How do I change my location settings?',
      answer: 'Go to More → Location Settings to manage your location permissions. This helps us show you nearby creators and relevant content.',
      category: 'settings'
    },
    {
      id: '9',
      question: 'What are XP and levels?',
      answer: 'XP (Experience Points) are earned by being active on the platform - posting, following, commenting, etc. As you gain XP, you level up and unlock new features and badges.',
      category: 'features'
    },
    {
      id: '10',
      question: 'How do I report inappropriate content?',
      answer: 'Tap the three dots menu on any post or profile, then select "Report". Our moderation team will review the content and take appropriate action.',
      category: 'safety'
    },
    {
      id: '11',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account by going to Settings → Account → Delete Account. This will permanently remove all your data from CreatorCircle.',
      category: 'account'
    },
    {
      id: '12',
      question: 'How do I update my skills and interests?',
      answer: 'Go to your Profile → Edit Profile, then scroll down to the Skills and Interests sections. You can add new ones or remove existing ones using the suggestions or by typing custom ones.',
      category: 'profile'
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'list' },
    { id: 'profile', name: 'Profile', icon: 'person' },
    { id: 'features', name: 'Features', icon: 'star' },
    { id: 'connections', name: 'Connections', icon: 'people' },
    { id: 'collaboration', name: 'Collaboration', icon: 'handshake' },
    { id: 'settings', name: 'Settings', icon: 'settings' },
    { id: 'safety', name: 'Safety', icon: 'shield' },
    { id: 'account', name: 'Account', icon: 'key' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const handleSendEmail = () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message fields.');
      return;
    }

    const emailSubject = encodeURIComponent(`[CreatorCircle Support] ${contactSubject}`);
    const emailBody = encodeURIComponent(
      `Hi CreatorCircle Support Team,\n\n${contactMessage}\n\nBest regards,\nCreatorCircle User`
    );
    
    const emailUrl = `mailto:support@creatorcircle.dev?subject=${emailSubject}&body=${emailBody}`;
    
    Linking.canOpenURL(emailUrl).then(supported => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Unable to open email client. Please email us directly at support@creatorcircle.dev');
      }
    });
  };

  const handleOpenEmail = () => {
    const emailUrl = 'mailto:support@creatorcircle.dev';
    Linking.canOpenURL(emailUrl).then(supported => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Unable to open email client. Please email us directly at support@creatorcircle.dev');
      }
    });
  };

  const renderFAQItem = (faq: FAQItem) => (
    <TouchableOpacity
      key={faq.id}
      style={styles.faqItem}
      onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <Ionicons
          name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </View>
      {expandedFAQ === faq.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContactForm = () => (
    <View style={styles.contactSection}>
      <Text style={styles.sectionTitle}>Contact Support</Text>
      <Text style={styles.sectionDescription}>
        Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Subject</Text>
        <TextInput
          style={styles.textInput}
          value={contactSubject}
          onChangeText={setContactSubject}
          placeholder="Brief description of your issue"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Message</Text>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          value={contactMessage}
          onChangeText={setContactMessage}
          placeholder="Describe your issue in detail..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.sendButton} onPress={handleSendEmail}>
        <Ionicons name="mail" size={20} color="white" />
        <Text style={styles.sendButtonText}>Send Message</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.emailButton} onPress={handleOpenEmail}>
        <Ionicons name="mail-outline" size={20} color="#007AFF" />
        <Text style={styles.emailButtonText}>Or email us directly: support@creatorcircle.dev</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help Section */}
        <View style={styles.quickHelpSection}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.quickHelpGrid}>
            <TouchableOpacity style={styles.quickHelpItem}>
              <Ionicons name="person-add" size={24} color="#007AFF" />
              <Text style={styles.quickHelpText}>Getting Started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickHelpItem}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.quickHelpText}>Connecting</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickHelpItem}>
              <Ionicons name="star" size={24} color="#007AFF" />
              <Text style={styles.quickHelpText}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickHelpItem}>
              <Ionicons name="settings" size={24} color="#007AFF" />
              <Text style={styles.quickHelpText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? 'white' : '#007AFF'} 
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ Items */}
          <View style={styles.faqList}>
            {filteredFAQs.map(renderFAQItem)}
          </View>
        </View>

        {/* Contact Support */}
        {renderContactForm()}

        {/* Additional Resources */}
        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Ionicons name="document-text" size={20} color="#666" />
            <Text style={styles.resourceText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Ionicons name="shield-checkmark" size={20} color="#666" />
            <Text style={styles.resourceText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Ionicons name="bug" size={20} color="#666" />
            <Text style={styles.resourceText}>Report a Bug</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need more help? We're here for you!
          </Text>
          <Text style={styles.footerEmail}>support@creatorcircle.dev</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  quickHelpSection: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickHelpItem: {
    width: (width - 60) / 2,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickHelpText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  faqSection: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 20,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  faqList: {
    marginTop: 8,
  },
  faqItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  messageInput: {
    height: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  emailButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  resourcesSection: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resourceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default HelpSupportScreen;
