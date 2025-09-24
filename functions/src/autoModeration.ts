import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Auto-moderation function that triggers when a post gets a new report
 */
export const onPostReported = onDocumentCreated(
  'posts/{postId}/reports/{reportId}',
  async (event) => {
    const postId = event.params.postId;
    const reportId = event.params.reportId;
    
    logger.info(`New report received for post ${postId}, report ${reportId}`);
    
    try {
      // Get all reports for this post
      const reportsSnapshot = await db
        .collection('posts')
        .doc(postId)
        .collection('reports')
        .orderBy('createdAt', 'desc')
        .get();
      
      const reportCount = reportsSnapshot.size;
      logger.info(`Post ${postId} now has ${reportCount} reports`);
      
      // Check if post should be auto-deleted (5+ reports)
      if (reportCount >= 5) {
        logger.warn(`Auto-deleting post ${postId} due to ${reportCount} reports`);
        await autoDeletePost(postId, reportCount);
      } else if (reportCount >= 3) {
        logger.info(`Post ${postId} has ${reportCount} reports - sending warning`);
        await sendWarningToPostOwner(postId, reportCount);
      }
    } catch (error) {
      logger.error('Error in auto-moderation:', error);
    }
  }
);

/**
 * Auto-moderation function that triggers when post report count is updated
 */
export const onPostReportCountUpdated = onDocumentUpdated(
  'posts/{postId}',
  async (event) => {
    const postId = event.params.postId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    // Check if report count increased
    const beforeReports = beforeData?.reports || 0;
    const afterReports = afterData?.reports || 0;
    
    if (afterReports > beforeReports) {
      logger.info(`Post ${postId} report count increased from ${beforeReports} to ${afterReports}`);
      
      try {
        // Get all reports for this post
        const reportsSnapshot = await db
          .collection('posts')
          .doc(postId)
          .collection('reports')
          .orderBy('createdAt', 'desc')
          .get();
        
        const reportCount = reportsSnapshot.size;
        
        // Check if post should be auto-deleted (5+ reports)
        if (reportCount >= 5) {
          logger.warn(`Auto-deleting post ${postId} due to ${reportCount} reports`);
          await autoDeletePost(postId, reportCount);
        } else if (reportCount >= 3) {
          logger.info(`Post ${postId} has ${reportCount} reports - sending warning`);
          await sendWarningToPostOwner(postId, reportCount);
        }
      } catch (error) {
        logger.error('Error in auto-moderation:', error);
      }
    }
  }
);

/**
 * Automatically delete a post and all its related data
 */
async function autoDeletePost(postId: string, reportCount: number): Promise<void> {
  try {
    const batch = db.batch();
    
    // Get post data for logging
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      logger.warn(`Post ${postId} not found, skipping deletion`);
      return;
    }
    
    const postData = postDoc.data();
    
    // Delete the post
    batch.delete(postRef);
    
    // Delete all reports for this post
    const reportsSnapshot = await db
      .collection('posts')
      .doc(postId)
      .collection('reports')
      .get();
    
    reportsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete all comments for this post
    const commentsSnapshot = await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();
    
    commentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete all likes for this post
    const likesSnapshot = await db
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .get();
    
    likesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit the batch deletion
    await batch.commit();
    
    // Log the auto-moderation action
    await logAutoModerationAction({
      postId,
      action: 'deleted',
      reason: `Automatically deleted due to ${reportCount} reports`,
      reportCount,
      adminAction: false
    });
    
    // Send notification to post owner
    if (postData?.userId) {
      await notifyPostOwner(postData.userId, postId, 'deleted', `Your post was automatically removed due to ${reportCount} reports from the community.`);
    }
    
    logger.info(`Post ${postId} auto-deleted successfully`);
  } catch (error) {
    logger.error('Error auto-deleting post:', error);
    throw error;
  }
}

/**
 * Send warning to post owner
 */
async function sendWarningToPostOwner(postId: string, reportCount: number): Promise<void> {
  try {
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) return;
    
    const postData = postDoc.data();
    if (!postData?.userId) return;
    
    const warningReason = `Your post has received ${reportCount} reports. Please review your content to ensure it follows community guidelines.`;
    
    // Log the warning
    await logAutoModerationAction({
      postId,
      action: 'warned',
      reason: warningReason,
      reportCount,
      adminAction: false
    });
    
    // Send notification to post owner
    await notifyPostOwner(postData.userId, postId, 'warned', warningReason);
    
    logger.info(`Warning sent to post owner for post ${postId}`);
  } catch (error) {
    logger.error('Error sending warning:', error);
  }
}

/**
 * Log auto-moderation actions
 */
async function logAutoModerationAction(logData: {
  postId: string;
  action: 'deleted' | 'warned' | 'reviewed';
  reason: string;
  reportCount: number;
  adminAction: boolean;
}): Promise<void> {
  try {
    const logRef = db.collection('autoModerationLogs').doc();
    const log = {
      id: logRef.id,
      postId: logData.postId,
      action: logData.action,
      reason: logData.reason,
      reportCount: logData.reportCount,
      createdAt: new Date(),
      adminAction: logData.adminAction
    };
    
    await logRef.set(log);
    logger.info(`Auto-moderation action logged: ${logData.action} for post ${logData.postId}`);
  } catch (error) {
    logger.error('Error logging auto-moderation action:', error);
  }
}

/**
 * Notify post owner about moderation action
 */
async function notifyPostOwner(
  userId: string, 
  postId: string, 
  action: 'deleted' | 'warned', 
  reason: string
): Promise<void> {
  try {
    const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
    const notification = {
      id: notificationRef.id,
      type: action === 'deleted' ? 'post_deleted' : 'post_warning',
      title: action === 'deleted' ? 'Post Removed' : 'Post Warning',
      message: reason,
      postId,
      read: false,
      createdAt: new Date(),
      data: {
        action,
        reason,
        postId
      }
    };
    
    await notificationRef.set(notification);
    logger.info(`Notification sent to user ${userId} for ${action}`);
  } catch (error) {
    logger.error('Error sending notification:', error);
  }
}
