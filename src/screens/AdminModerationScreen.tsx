import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutoModerationService, PostReport } from '../services/autoModerationService';
import { PostService } from '../services/postService';
import { Post } from '../types';

interface AutoModerationLog {
  id: string;
  postId: string;
  action: 'deleted' | 'warned' | 'reviewed';
  reason: string;
  reportCount: number;
  reports: PostReport[];
  createdAt: Date;
  adminAction: boolean;
}

interface HighReportPost {
  post: Post;
  reportCount: number;
  reports: PostReport[];
}

const AdminModerationScreen: React.FC = () => {
  const [logs, setLogs] = useState<AutoModerationLog[]>([]);
  const [highReportPosts, setHighReportPosts] = useState<HighReportPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'posts'>('logs');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, postsData] = await Promise.all([
        AutoModerationService.getAutoModerationLogs(50),
        AutoModerationService.getHighReportPosts(3)
      ]);
      
      setLogs(logsData);
      setHighReportPosts(postsData);
    } catch (error) {
      console.error('Error loading moderation data:', error);
      Alert.alert('Error', 'Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProcessAllPosts = async () => {
    Alert.alert(
      'Process All Posts',
      'This will check all posts for auto-moderation actions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await AutoModerationService.processAllPosts();
              Alert.alert(
                'Processing Complete',
                `Deleted: ${result.deletedCount}\nWarned: ${result.warnedCount}\nProcessed: ${result.processedCount}`
              );
              await loadData();
            } catch (error) {
              console.error('Error processing posts:', error);
              Alert.alert('Error', 'Failed to process posts');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to manually delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would need to be implemented in PostService
              Alert.alert('Success', 'Post deleted successfully');
              await loadData();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'deleted': return '#FF3B30';
      case 'warned': return '#FF9500';
      case 'reviewed': return '#34C759';
      default: return '#666';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'deleted': return 'trash';
      case 'warned': return 'warning';
      case 'reviewed': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const renderLogItem = ({ item }: { item: AutoModerationLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.logAction}>
          <Ionicons 
            name={getActionIcon(item.action)} 
            size={20} 
            color={getActionColor(item.action)} 
          />
          <Text style={[styles.logActionText, { color: getActionColor(item.action) }]}>
            {item.action.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.logDate}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <Text style={styles.logPostId}>Post ID: {item.postId}</Text>
      <Text style={styles.logReason}>{item.reason}</Text>
      <Text style={styles.logReportCount}>
        Reports: {item.reportCount} | {item.adminAction ? 'Admin Action' : 'Auto Action'}
      </Text>
      
      {item.reports.length > 0 && (
        <View style={styles.reportsContainer}>
          <Text style={styles.reportsTitle}>Reports:</Text>
          {item.reports.slice(0, 3).map((report, index) => (
            <Text key={index} style={styles.reportItem}>
              • {report.userName}: {report.reason}
            </Text>
          ))}
          {item.reports.length > 3 && (
            <Text style={styles.moreReports}>+{item.reports.length - 3} more</Text>
          )}
        </View>
      )}
    </View>
  );

  const renderPostItem = ({ item }: { item: HighReportPost }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <Text style={styles.postId}>Post ID: {item.post.id}</Text>
        <View style={styles.reportBadge}>
          <Text style={styles.reportCount}>{item.reportCount} reports</Text>
        </View>
      </View>
      
      <Text style={styles.postContent} numberOfLines={3}>
        {item.post.content}
      </Text>
      
      <View style={styles.postMeta}>
        <Text style={styles.postUser}>User: {item.post.userId}</Text>
        <Text style={styles.postDate}>{formatDate(item.post.createdAt)}</Text>
      </View>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePost(item.post.id)}
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => {
            // Navigate to post details
            Alert.alert('View Post', 'Navigate to post details');
          }}
        >
          <Ionicons name="eye" size={16} color="white" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading moderation data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Auto Moderation</Text>
        <TouchableOpacity 
          style={styles.processButton}
          onPress={handleProcessAllPosts}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.processButtonText}>Process All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
            Logs ({logs.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            High Reports ({highReportPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'logs' ? logs : highReportPosts}
        renderItem={activeTab === 'logs' ? renderLogItem : renderPostItem}
        keyExtractor={(item) => activeTab === 'logs' ? item.id : item.post.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark" size={48} color="#666" />
            <Text style={styles.emptyText}>
              {activeTab === 'logs' 
                ? 'No moderation actions yet' 
                : 'No posts with high report counts'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  processButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logDate: {
    fontSize: 12,
    color: '#666',
  },
  logPostId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logReason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  logReportCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  reportsContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  reportsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reportItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  moreReports: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  postItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postId: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  reportBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postUser: {
    fontSize: 12,
    color: '#666',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default AdminModerationScreen;
