import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StreakService } from '../services/streakService';

interface StreakDisplayProps {
  userId: string;
  profile?: {
    streakCount?: number;
    lastStreakWindowStart?: string;
  };
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  // New: compact badge variant for inline display (e.g., on other profiles)
  variant?: 'card' | 'badge';
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ 
  userId, 
  profile, 
  size = 'medium',
  showLabel = true,
  variant = 'card'
}) => {
  const [streakData, setStreakData] = useState<{
    streakCount: number;
    isActive: boolean;
  }>({ streakCount: 0, isActive: false });
  const [loading, setLoading] = useState(true);
  const [animatedValue] = useState(new Animated.Value(0));

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 16,
      fontSize: 12,
      labelSize: 10,
      containerPadding: 6,
    },
    medium: {
      iconSize: 20,
      fontSize: 16,
      labelSize: 12,
      containerPadding: 8,
    },
    large: {
      iconSize: 24,
      fontSize: 18,
      labelSize: 14,
      containerPadding: 10,
    },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    loadStreakData();
  }, [userId, profile]);

  useEffect(() => {
    // Animate streak display
    if (streakData.streakCount > 0) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [streakData.streakCount]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      console.log('🔥 StreakDisplay: Loading streak data for user:', userId);
      console.log('🔥 StreakDisplay: Profile data:', profile);
      
      // Use profile data if available, otherwise fetch from service
      if (profile && typeof profile.streakCount === 'number') {
        // Use profile data directly
        console.log('🔥 StreakDisplay: Using profile data, streak:', profile.streakCount);
        setStreakData({
          streakCount: profile.streakCount,
          isActive: profile.streakCount > 0, // Only active if streak > 0
        });
      } else {
        // Fetch from service
        console.log('🔥 StreakDisplay: Fetching from StreakService...');
        const data = await StreakService.getUserStreak(userId);
        console.log('🔥 StreakDisplay: Got streak data:', data);
        setStreakData(data);
      }
    } catch (error) {
      console.error('❌ StreakDisplay: Error loading streak data:', error);
      setStreakData({ streakCount: 0, isActive: false });
    } finally {
      setLoading(false);
      console.log('🔥 StreakDisplay: Loading completed, final streak data:', streakData);
    }
  };

  // Don't show anything if still loading
  if (loading) {
    console.log('🔥 StreakDisplay: Still loading, not rendering');
    return null;
  }

  console.log('🔥 StreakDisplay: Rendering with streak data:', streakData);

  // Compact badge variant: always render a tiny inline badge with fire + count + optional text
  if (variant === 'badge') {
    const count = streakData.streakCount || 0;
    return (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeFire}>🔥</Text>
        <Text style={styles.badgeCount}>{count}</Text>
        <Text style={styles.badgeLabel}>days</Text>
      </View>
    );
  }

  // Show encouragement message if no streak yet
  if (streakData.streakCount === 0) {
    console.log('🔥 StreakDisplay: Rendering zero streak display');
    return (
      <View style={[styles.container, styles.noStreakContainer]}>
        <View style={styles.zeroStreakContent}>
          <View style={styles.flameContainer}>
            <Text style={styles.dimmedFlame}>🔥</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.zeroStreakTitle}>Start Your Streak</Text>
            <Text style={styles.zeroStreakSubtitle}>Post daily to build your fire!</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
      </View>
    );
  }

  console.log('🔥 StreakDisplay: Rendering active streak display with count:', streakData.streakCount);

  const getStreakGradient = () => {
    if (!streakData.isActive) return ['#6C757D', '#495057']; // Inactive/expired - gray
    if (streakData.streakCount >= 100) return ['#FF0080', '#FF6B35']; // 100+ days - pink to red
    if (streakData.streakCount >= 30) return ['#FF6B35', '#FF8C42']; // 30+ days - red to orange
    if (streakData.streakCount >= 14) return ['#FF8C42', '#FFA500']; // 14+ days - orange
    if (streakData.streakCount >= 7) return ['#FFA500', '#FFD700']; // 7+ days - orange to gold
    return ['#FFD700', '#FFC107']; // 1-6 days - gold
  };

  const getStreakEmoji = () => {
    if (streakData.streakCount >= 100) return '🔥🔥🔥'; // 100+ days
    if (streakData.streakCount >= 30) return '🔥🔥'; // 30+ days
    return '🔥'; // 1+ days
  };

  const getStreakMessage = () => {
    if (streakData.streakCount >= 365) return 'Legendary!';
    if (streakData.streakCount >= 100) return 'Amazing!';
    if (streakData.streakCount >= 30) return 'On Fire!';
    if (streakData.streakCount >= 7) return 'Hot Streak!';
    return 'Keep Going!';
  };

  const getNextMilestone = () => {
    const count = streakData.streakCount;
    if (count < 7) return `${7 - count} more for Hot Streak!`;
    if (count < 30) return `${30 - count} more for On Fire!`;
    if (count < 100) return `${100 - count} more for Amazing!`;
    if (count < 365) return `${365 - count} more for Legendary!`;
    return 'You are legendary! 🏆';
  };

  const gradientColors = getStreakGradient();

  return (
    <Animated.View 
      style={[
        styles.container, 
        styles.activeStreakContainer,
        { 
          transform: [{ scale: animatedValue }],
        }
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
      {/* Streak Header */}
      <View style={styles.streakHeader}>
        <View style={styles.flameRow}>
          <Text style={[styles.streakEmoji, { fontSize: config.iconSize + 4 }]}>
            {getStreakEmoji()}
          </Text>
          <Text 
            style={[
              styles.streakCount, 
              { 
                fontSize: config.fontSize + 6,
                color: '#FFFFFF',
                fontWeight: 'bold',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }
            ]}
          >
            {streakData.streakCount}
          </Text>
          <Text style={styles.dayText}>day{streakData.streakCount !== 1 ? 's' : ''}</Text>
        </View>
        
        {!streakData.isActive && (
          <View style={styles.expiredBadge}>
            <Ionicons name="time-outline" size={12} color="#FFF" />
            <Text style={styles.expiredText}>Ended</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min((streakData.streakCount / 30) * 100, 100)}%`,
              backgroundColor: '#FFFFFF',
            }
          ]} 
        />
      </View>
      
      {/* Streak Message */}
      {showLabel && (
        <View style={styles.messageContainer}>
          <Text style={[styles.streakLabel, { fontSize: config.labelSize, color: '#FFFFFF' }]}>
            {streakData.isActive ? getStreakMessage() : 'Streak Ended'}
          </Text>
          <Text style={styles.nextMilestone}>
            {getNextMilestone()}
          </Text>
        </View>
      )}

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.sparkle, styles.sparkle1]} />
          <View style={[styles.sparkle, styles.sparkle2]} />
          <View style={[styles.sparkle, styles.sparkle3]} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    minHeight: 80,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  // Inline badge styles (compact)
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderColor: '#FFECB5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeFire: {
    fontSize: 14,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeLabel: {
    fontSize: 11,
    color: '#92400E',
  },
  noStreakContainer: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    padding: 16,
  },
  activeStreakContainer: {
    // Background will be set dynamically based on streak level
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  
  // Zero Streak Styles
  zeroStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flameContainer: {
    marginRight: 12,
  },
  dimmedFlame: {
    fontSize: 24,
    opacity: 0.4,
  },
  streakInfo: {
    flex: 1,
  },
  zeroStreakTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 2,
  },
  zeroStreakSubtitle: {
    fontSize: 12,
    color: '#6C757D',
  },
  
  // Active Streak Styles
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    marginRight: 8,
  },
  streakCount: {
    marginRight: 4,
  },
  dayText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  expiredText: {
    fontSize: 10,
    color: '#FFF',
    marginLeft: 2,
    fontWeight: '600',
  },
  
  // Progress Bar
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.8,
  },
  
  // Message Container
  messageContainer: {
    alignItems: 'center',
  },
  streakLabel: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  nextMilestone: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  
  // Decorative Elements
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    opacity: 0.6,
  },
  sparkle1: {
    top: 12,
    right: 16,
  },
  sparkle2: {
    top: 24,
    right: 32,
    width: 3,
    height: 3,
  },
  sparkle3: {
    bottom: 16,
    left: 20,
    width: 2,
    height: 2,
  },
});

export default StreakDisplay;
