import { db } from '../config/firebase';
import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { UserService } from '../services/userService';

export class TestUserCleanup {
  /**
   * List all users in the database
   */
  static async listAllUsers(): Promise<void> {
    try {
      console.log('📋 Fetching all users...');
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      if (snapshot.empty) {
        console.log('✨ No users found in the database');
        return;
      }
      
      console.log(`\n📊 Found ${snapshot.size} users:`);
      console.log('=' .repeat(80));
      
      snapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        console.log(`\n👤 User ID: ${userDoc.id}`);
        console.log(`   Name: ${userData.name || 'No name'}`);
        console.log(`   Email: ${userData.email || 'No email'}`);
        console.log(`   College: ${userData.college || 'No college'}`);
        console.log(`   Created: ${userData.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}`);
        console.log(`   Posts: ${userData.postsCount || 0}`);
        console.log(`   Followers: ${userData.followers || 0}`);
        console.log(`   Following: ${userData.following || 0}`);
        
        // Check if this looks like a test user
        const isTestUser = this.isTestUser(userData);
        if (isTestUser) {
          console.log(`   🧪 TEST USER DETECTED`);
        }
      });
      
      console.log('\n' + '=' .repeat(80));
      
    } catch (error) {
      console.error('❌ Error listing users:', error);
      throw error;
    }
  }
  
  /**
   * Identify test users based on common patterns
   */
  static isTestUser(userData: any): boolean {
    const name = (userData.name || '').toLowerCase();
    const email = (userData.email || '').toLowerCase();
    const college = (userData.college || '').toLowerCase();
    
    // Common test user patterns
    const testPatterns = [
      'test', 'demo', 'sample', 'example', 'fake', 'dummy',
      'user1', 'user2', 'user3', 'admin', 'tester',
      'john doe', 'jane doe', 'test user', 'demo user'
    ];
    
    return testPatterns.some(pattern => 
      name.includes(pattern) || 
      email.includes(pattern) || 
      college.includes(pattern)
    );
  }
  
  /**
   * Delete specific users by their IDs
   */
  static async deleteUsersByIds(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      console.log('⚠️ No user IDs provided');
      return;
    }
    
    console.log(`🗑️ Deleting ${userIds.length} users...`);
    
    for (const userId of userIds) {
      try {
        console.log(`\n🗑️ Deleting user: ${userId}`);
        await UserService.deleteUserAccount(userId);
        console.log(`✅ Successfully deleted user: ${userId}`);
      } catch (error) {
        console.error(`❌ Error deleting user ${userId}:`, error);
        // Continue with other users even if one fails
      }
    }
    
    console.log('\n✅ User deletion process completed');
  }
  
  /**
   * Delete all test users automatically
   */
  static async deleteAllTestUsers(): Promise<void> {
    try {
      console.log('🔍 Finding test users...');
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const testUserIds: string[] = [];
      
      snapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (this.isTestUser(userData)) {
          testUserIds.push(userDoc.id);
          console.log(`🧪 Found test user: ${userData.name || 'No name'} (${userDoc.id})`);
        }
      });
      
      if (testUserIds.length === 0) {
        console.log('✨ No test users found');
        return;
      }
      
      console.log(`\n🗑️ Found ${testUserIds.length} test users to delete`);
      
      // Ask for confirmation
      console.log('\n⚠️ WARNING: This will permanently delete all test users!');
      console.log('Test users to be deleted:');
      testUserIds.forEach(id => console.log(`  - ${id}`));
      
      await this.deleteUsersByIds(testUserIds);
      
    } catch (error) {
      console.error('❌ Error deleting test users:', error);
      throw error;
    }
  }
  
  /**
   * Delete all users (DANGEROUS - use with caution)
   */
  static async deleteAllUsers(): Promise<void> {
    try {
      console.log('🚨 WARNING: This will delete ALL users from the database!');
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      if (snapshot.empty) {
        console.log('✨ No users found');
        return;
      }
      
      const allUserIds = snapshot.docs.map(doc => doc.id);
      console.log(`\n🗑️ Deleting ALL ${allUserIds.length} users...`);
      
      await this.deleteUsersByIds(allUserIds);
      
    } catch (error) {
      console.error('❌ Error deleting all users:', error);
      throw error;
    }
  }
}

// Usage examples:
// TestUserCleanup.listAllUsers(); // List all users
// TestUserCleanup.deleteAllTestUsers(); // Delete only test users
// TestUserCleanup.deleteUsersByIds(['userId1', 'userId2']); // Delete specific users
// TestUserCleanup.deleteAllUsers(); // Delete ALL users (dangerous!)
