import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../types';

export interface PostReport {
  id: string;
  userId: string;
  userName: string;
  reason: 'inappropriate' | 'spam' | 'offensive' | 'other';
  createdAt: Date;
}

export interface AutoModerationLog {
  id: string;
  postId: string;
  action: 'deleted' | 'warned' | 'reviewed';
  reason: string;
  reportCount: number;
  reports: PostReport[];
  createdAt: Date;
  adminAction?: boolean;
}

export class AutoModerationService {
  private static readonly REPORT_THRESHOLD = 5;
  private static readonly WARNING_THRESHOLD = 3;

  /**
   * Check if a post should be automatically deleted based on reports
   */
  static async checkPostReports(postId: string): Promise<{
    shouldDelete: boolean;
    reportCount: number;
    reports: PostReport[];
  }> {
    try {
      console.log(`🔍 Checking reports for post: ${postId}`);
      
      // Get all reports for this post
      const reportsRef = collection(db, 'posts', postId, 'reports');
      const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));
      const reportsSnapshot = await getDocs(reportsQuery);
      
      const reports: PostReport[] = [];
      reportsSnapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          reason: data.reason,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });

      const reportCount = reports.length;
      const shouldDelete = reportCount >= this.REPORT_THRESHOLD;

      console.log(`📊 Post ${postId}: ${reportCount} reports (threshold: ${this.REPORT_THRESHOLD})`);
      
      return {
        shouldDelete,
        reportCount,
        reports
      };
    } catch (error) {
      console.error('❌ Error checking post reports:', error);
      throw error;
    }
  }

  /**
   * Automatically delete a post and log the action
   */
  static async autoDeletePost(
    postId: string, 
    reports: PostReport[], 
    reason: string = 'Automatically deleted due to multiple reports'
  ): Promise<void> {
    try {
      console.log(`🗑️ Auto-deleting post: ${postId}`);
      
      const batch = writeBatch(db);
      
      // Get post data for logging
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      const postData = postSnap.data() as Post;
      
      if (!postData) {
        console.log('⚠️ Post not found, skipping deletion');
        return;
      }

      // Delete the post
      batch.delete(postRef);
      
      // Delete all reports for this post
      const reportsRef = collection(db, 'posts', postId, 'reports');
      const reportsSnapshot = await getDocs(reportsRef);
      reportsSnapshot.forEach(reportDoc => {
        batch.delete(reportDoc.ref);
      });

      // Delete all comments for this post
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      commentsSnapshot.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });

      // Delete all likes for this post
      const likesRef = collection(db, 'posts', postId, 'likes');
      const likesSnapshot = await getDocs(likesRef);
      likesSnapshot.forEach(likeDoc => {
        batch.delete(likeDoc.ref);
      });

      // Commit the batch deletion
      await batch.commit();

      // Log the auto-moderation action
      await this.logAutoModerationAction({
        postId,
        action: 'deleted',
        reason,
        reportCount: reports.length,
        reports,
        adminAction: false
      });

      // Send notification to post owner
      await this.notifyPostOwner(postData.userId, postId, 'deleted', reason);

      console.log(`✅ Post ${postId} auto-deleted successfully`);
    } catch (error) {
      console.error('❌ Error auto-deleting post:', error);
      throw error;
    }
  }

  /**
   * Send warning to post owner when approaching threshold
   */
  static async sendWarningToPostOwner(
    postId: string, 
    reportCount: number, 
    reports: PostReport[]
  ): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      const postData = postSnap.data() as Post;
      
      if (!postData) return;

      const warningReason = `Your post has received ${reportCount} reports. Please review your content to ensure it follows community guidelines.`;
      
      // Log the warning
      await this.logAutoModerationAction({
        postId,
        action: 'warned',
        reason: warningReason,
        reportCount,
        reports,
        adminAction: false
      });

      // Send notification to post owner
      await this.notifyPostOwner(postData.userId, postId, 'warned', warningReason);

      console.log(`⚠️ Warning sent to post owner for post ${postId}`);
    } catch (error) {
      console.error('❌ Error sending warning:', error);
    }
  }

  /**
   * Log auto-moderation actions
   */
  private static async logAutoModerationAction(logData: {
    postId: string;
    action: 'deleted' | 'warned' | 'reviewed';
    reason: string;
    reportCount: number;
    reports: PostReport[];
    adminAction: boolean;
  }): Promise<void> {
    try {
      const logRef = doc(collection(db, 'autoModerationLogs'));
      const log: AutoModerationLog = {
        id: logRef.id,
        postId: logData.postId,
        action: logData.action,
        reason: logData.reason,
        reportCount: logData.reportCount,
        reports: logData.reports,
        createdAt: new Date(),
        adminAction: logData.adminAction
      };

      await updateDoc(logRef, log);
      console.log(`📝 Auto-moderation action logged: ${logData.action} for post ${logData.postId}`);
    } catch (error) {
      console.error('❌ Error logging auto-moderation action:', error);
    }
  }

  /**
   * Notify post owner about moderation action
   */
  private static async notifyPostOwner(
    userId: string, 
    postId: string, 
    action: 'deleted' | 'warned', 
    reason: string
  ): Promise<void> {
    try {
      // Create notification document
      const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
      const notification = {
        id: notificationRef.id,
        type: action === 'deleted' ? 'post_deleted' : 'post_warning',
        title: action === 'deleted' ? 'Post Removed' : 'Post Warning',
        message: reason,
        postId,
        read: false,
        createdAt: serverTimestamp(),
        data: {
          action,
          reason,
          postId
        }
      };

      await updateDoc(notificationRef, notification);
      console.log(`📬 Notification sent to user ${userId} for ${action}`);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  /**
   * Process all posts and check for auto-moderation actions
   */
  static async processAllPosts(): Promise<{
    deletedCount: number;
    warnedCount: number;
    processedCount: number;
  }> {
    try {
      console.log('🔄 Processing all posts for auto-moderation...');
      
      const postsRef = collection(db, 'posts');
      const postsSnapshot = await getDocs(postsRef);
      
      let deletedCount = 0;
      let warnedCount = 0;
      let processedCount = 0;

      for (const postDoc of postsSnapshot.docs) {
        const postId = postDoc.id;
        const { shouldDelete, reportCount, reports } = await this.checkPostReports(postId);
        
        if (shouldDelete) {
          await this.autoDeletePost(postId, reports, `Automatically deleted due to ${reportCount} reports`);
          deletedCount++;
        } else if (reportCount >= this.WARNING_THRESHOLD && reportCount < this.REPORT_THRESHOLD) {
          await this.sendWarningToPostOwner(postId, reportCount, reports);
          warnedCount++;
        }
        
        processedCount++;
      }

      console.log(`✅ Auto-moderation complete: ${deletedCount} deleted, ${warnedCount} warned, ${processedCount} processed`);
      
      return {
        deletedCount,
        warnedCount,
        processedCount
      };
    } catch (error) {
      console.error('❌ Error processing posts for auto-moderation:', error);
      throw error;
    }
  }

  /**
   * Get auto-moderation logs
   */
  static async getAutoModerationLogs(limitCount: number = 50): Promise<AutoModerationLog[]> {
    try {
      const logsRef = collection(db, 'autoModerationLogs');
      const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const logsSnapshot = await getDocs(logsQuery);
      
      const logs: AutoModerationLog[] = [];
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          postId: data.postId,
          action: data.action,
          reason: data.reason,
          reportCount: data.reportCount,
          reports: data.reports || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          adminAction: data.adminAction || false
        });
      });

      return logs;
    } catch (error) {
      console.error('❌ Error getting auto-moderation logs:', error);
      throw error;
    }
  }

  /**
   * Get posts with high report counts (for admin review)
   */
  static async getHighReportPosts(threshold: number = 3): Promise<Array<{
    post: Post;
    reportCount: number;
    reports: PostReport[];
  }>> {
    try {
      const postsRef = collection(db, 'posts');
      const postsSnapshot = await getDocs(postsRef);
      
      const highReportPosts = [];

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data() as Post;
        const { reportCount, reports } = await this.checkPostReports(postDoc.id);
        
        if (reportCount >= threshold) {
          highReportPosts.push({
            post: postData,
            reportCount,
            reports
          });
        }
      }

      // Sort by report count (highest first)
      highReportPosts.sort((a, b) => b.reportCount - a.reportCount);

      return highReportPosts;
    } catch (error) {
      console.error('❌ Error getting high report posts:', error);
      throw error;
    }
  }

}
