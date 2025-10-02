import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { AIUsageService, AIFeature, AIUsageStats } from '../services/aiUsageService';

interface AIFeaturesSettingsProps {
  onFeaturePress?: (feature: AIFeature) => void;
}

export const AIFeaturesSettings: React.FC<AIFeaturesSettingsProps> = ({
  onFeaturePress,
}) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadAIData();
    }
  }, [user]);

  const loadAIData = async () => {
    try {
      setLoading(true);
      
      // Load available features
      const availableFeatures = AIUsageService.getAvailableFeatures();
      
      // Load user's usage statistics
      const stats = await AIUsageService.getUserStats(user!.uid);
      
      // Update features with usage counts
      const featuresWithUsage = availableFeatures.map(feature => ({
        ...feature,
        usageCount: stats?.featuresUsed[feature.id] || 0,
        lastUsed: stats?.lastUsed,
      }));

      setFeatures(featuresWithUsage);
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load AI data:', error);
      Alert.alert('Error', 'Failed to load AI features data');
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePress = (feature: AIFeature) => {
    if (onFeaturePress) {
      onFeaturePress(feature);
    } else {
      Alert.alert(
        feature.name,
        `${feature.description}\n\nUsage: ${feature.usageCount} times`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading AI Features...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Usage Overview */}
      {usageStats && (
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>AI Usage Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(usageStats.totalRequests)}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(usageStats.totalTokens)}</Text>
              <Text style={styles.statLabel}>Tokens Used</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>${usageStats.totalCost.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Cost</Text>
            </View>
          </View>
          <Text style={styles.lastUsedText}>
            Last used: {formatDate(usageStats.lastUsed)}
          </Text>
        </View>
      )}

      {/* AI Features List */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Available AI Features</Text>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureItem}
            onPress={() => handleFeaturePress(feature)}
          >
            <View style={styles.featureIcon}>
              <Ionicons 
                name={feature.icon as any} 
                size={24} 
                color={feature.enabled ? "#007AFF" : "#999"} 
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              <View style={styles.featureStats}>
                <Text style={styles.usageText}>
                  Used {feature.usageCount} times
                </Text>
                {feature.lastUsed && (
                  <Text style={styles.lastUsedText}>
                    Last: {formatDate(feature.lastUsed)}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.featureStatus}>
              <Ionicons 
                name={feature.enabled ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={feature.enabled ? "#34C759" : "#FF3B30"} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Admin Section (if needed) */}
      {user?.email && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => {
              Alert.alert(
                'AI Usage by Email',
                `Your email: ${user.email}\n\nYou can track AI usage by user email using the admin functions.`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="analytics-outline" size={20} color="#007AFF" />
            <Text style={styles.adminButtonText}>View Usage Analytics</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  overviewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  lastUsedText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  featureStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  featureStatus: {
    marginLeft: 12,
  },
  adminSection: {
    marginTop: 20,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  adminButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});
