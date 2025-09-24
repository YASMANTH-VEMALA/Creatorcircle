import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  visible,
  onClose,
  featureName,
  description = 'This feature is coming soon!',
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.modalContainer}>
          <BlurView intensity={15} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={colors.glassGradient}
            style={[styles.glassContainer, { borderColor: colors.glassBorder }]}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Coming Soon!
              </Text>
            </View>

            <View style={styles.content}>
              <Text style={[styles.featureName, { color: colors.text }]}>
                {featureName}
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {description}
              </Text>
              
              <View style={styles.fireContainer}>
                <Ionicons name="flame" size={24} color="#FF6B35" />
                <Ionicons name="flame" size={28} color="#FF8C42" />
                <Ionicons name="flame" size={24} color="#FF6B35" />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Got it!
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  glassContainer: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featureName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  fireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComingSoonModal;
