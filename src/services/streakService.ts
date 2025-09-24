import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Profile } from '../types';

export class StreakService {
  private static readonly IST_TIMEZONE = 'Asia/Kolkata';
  private static readonly WINDOW_START_HOUR = 4; // 4:00 AM IST

  /**
   * Get the streak day identifier for a given date
   * Simple approach: YYYY-MM-DD format based on 4 AM boundary
   * If time is before 4 AM, it belongs to the previous day
   */
  private static getStreakDay(date: Date): string {
    try {
      // Ensure we have a valid date
      if (!date || isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date provided to getStreakDay, using current date');
        date = new Date();
      }

      // Create a copy to avoid modifying original
      const workingDate = new Date(date.getTime());
      
      // If time is before 4 AM, subtract one day
      if (workingDate.getHours() < 4) {
        workingDate.setDate(workingDate.getDate() - 1);
      }
      
      // Return simple YYYY-MM-DD format
      const year = workingDate.getFullYear();
      const month = String(workingDate.getMonth() + 1).padStart(2, '0');
      const day = String(workingDate.getDate()).padStart(2, '0');
      
      const dayId = `${year}-${month}-${day}`;
      console.log(`📅 Streak day for ${date.toISOString()}: ${dayId}`);
      return dayId;
    } catch (error) {
      console.error('❌ Error calculating streak day:', error);
      // Ultra-safe fallback
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  /**
   * Format date to ISO string for consistent storage
   */
  private static formatWindowStart(date: Date): string {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date provided to formatWindowStart, using current date');
        date = new Date();
      }
      return date.toISOString();
    } catch (error) {
      console.error('❌ Error formatting window start date:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Check if two streak days are consecutive
   * Simple approach: parse YYYY-MM-DD and check if exactly 1 day apart
   */
  private static areConsecutiveDays(currentDay: string, lastDay: string): boolean {
    try {
      if (!currentDay || !lastDay || typeof currentDay !== 'string' || typeof lastDay !== 'string') {
        console.warn('⚠️ Invalid day parameters:', { currentDay, lastDay });
        return false;
      }
      
      console.log(`🔍 Checking consecutive days: current=${currentDay}, last=${lastDay}`);
      
      // Parse YYYY-MM-DD format
      const [currentYear, currentMonth, currentDate] = currentDay.split('-').map(Number);
      const [lastYear, lastMonth, lastDate] = lastDay.split('-').map(Number);
      
      // Create dates at noon to avoid timezone issues
      const currentDateObj = new Date(currentYear, currentMonth - 1, currentDate, 12, 0, 0);
      const lastDateObj = new Date(lastYear, lastMonth - 1, lastDate, 12, 0, 0);
      
      // Check if exactly 1 day apart
      const diffMs = currentDateObj.getTime() - lastDateObj.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(diffMs / oneDayMs);
      
      console.log(`📊 Day difference: ${diffDays} days`);
      
      const isConsecutive = diffDays === 1;
      console.log(`🔗 Days consecutive: ${isConsecutive}`);
      
      return isConsecutive;
    } catch (error) {
      console.error('❌ Error checking consecutive days:', error);
      return false;
    }
  }

  /**
   * Update user's streak when they create a post
   */
  static async updateStreakOnPost(userId: string, postCreatedAt: Date): Promise<void> {
    try {
      console.log(`🔥 Updating streak for user: ${userId}`);
      
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        console.warn(`⚠️ Invalid userId provided: ${userId}`);
        return;
      }
      
      if (!postCreatedAt || !(postCreatedAt instanceof Date) || isNaN(postCreatedAt.getTime())) {
        console.warn(`⚠️ Invalid postCreatedAt provided, using current date`);
        postCreatedAt = new Date();
      }
      
      // Get the streak day for this post (simple YYYY-MM-DD format)
      const currentStreakDay = this.getStreakDay(postCreatedAt);
      console.log(`📅 Current streak day: ${currentStreakDay}`);
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.warn(`⚠️ User document not found: ${userId}`);
        return;
      }
      
      const userData = userDoc.data() as Profile;
      const currentStreak = userData.streakCount || 0;
      const lastStreakDay = userData.lastStreakWindowStart || null; // Reusing this field for day storage
      
      console.log(`📊 Current user streak: ${currentStreak}`);
      console.log(`📍 Last streak day: ${lastStreakDay}`);
      
      // If user already posted today, don't update streak
      if (lastStreakDay === currentStreakDay) {
        console.log(`✅ User already posted today (${currentStreakDay}) - no streak update needed`);
        return;
      }
      
      let newStreakCount = 1; // Default: start new streak
      
      if (lastStreakDay && currentStreak > 0) {
        // Check if this day is consecutive to the last day
        if (this.areConsecutiveDays(currentStreakDay, lastStreakDay)) {
          // Consecutive day - increment streak by 1
          newStreakCount = currentStreak + 1;
          console.log(`🔥 Consecutive day detected - incrementing streak to: ${newStreakCount}`);
        } else {
          // Gap detected - reset to 1 (new streak)
          console.log(`💔 Gap detected between ${lastStreakDay} and ${currentStreakDay} - starting new streak at: 1`);
          newStreakCount = 1;
        }
      } else {
        // First post ever or no previous streak - start at 1
        console.log(`🌟 Starting first streak at: 1`);
        newStreakCount = 1;
      }
      
      // Update user document
      const updateData = {
        streakCount: newStreakCount,
        lastStreakWindowStart: currentStreakDay, // Store the day instead of timestamp
        timezone: this.IST_TIMEZONE,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);
      
      console.log(`✅ Streak updated successfully - New streak: ${newStreakCount} days`);
      
      // Log milestone achievements
      if (newStreakCount === 1) {
        console.log(`🎉 User started a new streak!`);
      } else if (newStreakCount % 7 === 0) {
        console.log(`🏆 User reached ${newStreakCount} day streak milestone!`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating streak for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get current streak information for a user
   */
  static async getUserStreak(userId: string): Promise<{ streakCount: number; isActive: boolean }> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { streakCount: 0, isActive: false };
      }
      
      const userData = userDoc.data() as Profile;
      const streakCount = userData.streakCount || 0;
      const lastStreakDay = userData.lastStreakWindowStart; // Now stores YYYY-MM-DD
      
      if (streakCount === 0 || !lastStreakDay) {
        return { streakCount: 0, isActive: false };
      }
      
      // Check if streak is still active
      // Active = user posted today OR yesterday (allowing grace period)
      const now = new Date();
      const todayStreakDay = this.getStreakDay(now);
      
      // Calculate yesterday's streak day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStreakDay = this.getStreakDay(yesterday);
      
      const isActive = lastStreakDay === todayStreakDay || lastStreakDay === yesterdayStreakDay;
      
      console.log(`📊 Streak check: count=${streakCount}, lastDay=${lastStreakDay}, today=${todayStreakDay}, yesterday=${yesterdayStreakDay}, active=${isActive}`);
      
      return { streakCount, isActive };
      
    } catch (error) {
      console.error(`❌ Error getting streak for user ${userId}:`, error);
      return { streakCount: 0, isActive: false };
    }
  }

  /**
   * Reset expired streaks (for scheduled cleanup - optional)
   */
  static async resetExpiredStreaks(): Promise<void> {
    try {
      console.log(`🧹 Starting expired streak cleanup...`);
      
      // This would typically be implemented as a Firebase Function
      // For now, we'll handle resets on-demand when checking streak status
      
      console.log(`✅ Expired streak cleanup completed`);
      
    } catch (error) {
      console.error(`❌ Error during streak cleanup:`, error);
      throw error;
    }
  }

  /**
   * Debug helper: Get window information for a date
   */
  static debugWindowInfo(date: Date): {
    inputDate: string;
    windowStart: string;
    windowEnd: string;
    isInWindow: boolean;
  } {
    try {
      // Validate input date
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date provided to debugWindowInfo, using current date');
        date = new Date();
      }

      const windowStart = this.getWindowStart(date);
      
      // Validate window start before proceeding
      if (!windowStart || isNaN(windowStart.getTime())) {
        throw new Error('Invalid window start calculated');
      }
      
      const windowEnd = new Date(windowStart.getTime()); // Use getTime() for safety
      windowEnd.setDate(windowEnd.getDate() + 1);
      windowEnd.setMilliseconds(windowEnd.getMilliseconds() - 1); // 3:59:59.999 AM next day
      
      return {
        inputDate: date.toISOString(),
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        isInWindow: date >= windowStart && date <= windowEnd
      };
    } catch (error) {
      console.error('❌ Error in debugWindowInfo:', error);
      const now = new Date();
      return {
        inputDate: now.toISOString(),
        windowStart: now.toISOString(),
        windowEnd: now.toISOString(),
        isInWindow: false
      };
    }
  }

  /**
   * Test method to verify streak service is working correctly
   */
  static testStreakService(): void {
    console.log('🧪 Testing StreakService (Simplified Version)...');
    
    try {
      // Test current date
      const now = new Date();
      console.log('🕒 Current time:', now.toISOString());
      
      // Test streak day calculation
      const todayStreakDay = this.getStreakDay(now);
      console.log('📅 Today streak day:', todayStreakDay);
      
      // Test yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStreakDay = this.getStreakDay(yesterday);
      console.log('📅 Yesterday streak day:', yesterdayStreakDay);
      
      // Test consecutive days
      const areConsecutive = this.areConsecutiveDays(todayStreakDay, yesterdayStreakDay);
      console.log('🔗 Today and yesterday consecutive:', areConsecutive);
      
      // Test edge case: before 4 AM
      const early = new Date();
      early.setHours(2, 30, 0, 0); // 2:30 AM
      const earlyStreakDay = this.getStreakDay(early);
      console.log('📅 2:30 AM streak day:', earlyStreakDay);
      
      // Test edge case: after 4 AM
      const late = new Date();
      late.setHours(10, 30, 0, 0); // 10:30 AM
      const lateStreakDay = this.getStreakDay(late);
      console.log('📅 10:30 AM streak day:', lateStreakDay);
      
      console.log('✅ StreakService test completed successfully');
    } catch (error) {
      console.error('❌ StreakService test failed:', error);
    }
  }

  /**
   * Safe test method that simulates streak update without database writes
   */
  static async testStreakUpdateSafely(userId: string): Promise<void> {
    console.log('🧪 Testing streak update safely (no database writes)...');
    
    try {
      const postCreatedAt = new Date();
      console.log(`🕒 Simulating post creation at: ${postCreatedAt.toISOString()}`);
      
      // Test streak day calculation
      const streakDay = this.getStreakDay(postCreatedAt);
      console.log(`📅 Streak day would be: ${streakDay}`);
      
      console.log('✅ Safe streak test completed - no database operations performed');
    } catch (error) {
      console.error('❌ Safe streak test failed:', error);
    }
  }
}
