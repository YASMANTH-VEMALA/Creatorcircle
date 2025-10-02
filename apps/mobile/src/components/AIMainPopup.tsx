import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIMainPopupProps {
  visible: boolean;
  onClose: () => void;
  onSuggestions: () => void;
  onAnalysis: () => void;
  onMore: () => void;
}

export const AIMainPopup: React.FC<AIMainPopupProps> = ({
  visible,
  onClose,
  onSuggestions,
  onAnalysis,
  onMore,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Assistant</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={onSuggestions}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="chatbubbles" size={24} color="#007AFF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Conversation Suggestions</Text>
              <Text style={styles.optionDescription}>
                Get AI-powered conversation starters and ideas
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={onAnalysis}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="analytics" size={24} color="#34C759" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Chat Analysis</Text>
              <Text style={styles.optionDescription}>
                Analyze conversation mood, tone, and get insights
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={onMore}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#FF9500" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>More</Text>
              <Text style={styles.optionDescription}>
                Share photos, videos, and links in chat
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Choose an AI feature to get started
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default AIMainPopup;
