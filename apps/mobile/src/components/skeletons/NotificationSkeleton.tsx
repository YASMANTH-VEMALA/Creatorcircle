import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleSkeleton from './SimpleSkeleton';
import { useTheme } from '../../contexts/ThemeContext';

const NotificationSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.skeletonContainer}>
        {/* Icon */}
        <SimpleSkeleton width={40} height={40} borderRadius={20} style={styles.icon} />
        
        {/* Content */}
        <View style={styles.content}>
          <SimpleSkeleton width={150} height={16} borderRadius={8} style={styles.title} />
          <SimpleSkeleton width="95%" height={14} borderRadius={7} style={styles.message} />
          <SimpleSkeleton width="80%" height={14} borderRadius={7} style={styles.message2} />
          <SimpleSkeleton width={80} height={12} borderRadius={6} style={styles.timestamp} />
        </View>

        {/* Action Button */}
        <SimpleSkeleton width={60} height={28} borderRadius={14} style={styles.actionButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  skeletonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    width: 150,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  message: {
    width: '95%',
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  message2: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
  },
  timestamp: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  actionButton: {
    width: 60,
    height: 28,
    borderRadius: 14,
    marginLeft: 12,
  },
});

export default NotificationSkeleton;
