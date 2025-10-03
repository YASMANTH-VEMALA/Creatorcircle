import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface PremiumFeatureModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  description: string;
}

const { width, height } = Dimensions.get('window');

const PremiumFeatureModal: React.FC<PremiumFeatureModalProps> = ({
  visible,
  onClose,
  featureName,
  description,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const firePulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start fire pulsing animation
      const startFirePulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(firePulseValue, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(firePulseValue, {
              toValue: 1.0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      startFirePulse();

      // Modal entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      firePulseValue.setValue(1);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
        <LinearGradient
          colors={colors.glassGradient}
          style={[styles.glassContainer, { borderColor: colors.glassBorder }]}
        >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="diamond" size={32} color="#FFD700" />
              </View>
              <Text style={[styles.premiumText, { 
                color: colors.secondary,
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }]}>Premium Feature</Text>
            </View>

            {/* Feature Name */}
            <Text style={[styles.featureName, { 
              color: colors.text,
              textShadowColor: 'rgba(0, 0, 0, 0.5)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }]}>{featureName}</Text>

            {/* Description */}
            <Text style={[styles.description, { 
              color: colors.textSecondary,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }]}>{description}</Text>

            {/* Coming Soon Section */}
            <View style={styles.comingSoonContainer}>
              <Animated.View
                style={[
                  styles.fireEffect,
                  {
                    transform: [{ scale: firePulseValue }],
                  },
                ]}
              >
                <Ionicons name="flame" size={24} color="#FF6B35" />
                <Ionicons name="flame" size={20} color="#FF8C00" />
                <Ionicons name="flame" size={16} color="#FFD700" />
              </Animated.View>
              <Text style={[styles.comingSoonText, { color: colors.text }]}>Coming Soon!</Text>
              <Text style={[styles.comingSoonSubtext, { color: colors.textSecondary }]}>
                This feature is currently in development
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.glassBackground }]}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Got it</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  glassContainer: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featureName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  comingSoonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  fireEffect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comingSoonSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PremiumFeatureModal;
