import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Profile } from '../types';
import { ProfileImageService } from './profileImageService';
// Import PostService for updating posts when profile changes
// Note: Using dynamic import to avoid circular dependency
import { FirebaseUtils } from '../utils/firebaseUtils';
import { PostService } from './postService';

export class UserService {
  static async createOrUpdateUserProfile(user: User, profileData: Partial<Profile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const profile: Profile = {
        uid: user.uid,
        email: user.email,
        name: profileData.name || '',
        college: profileData.college || '',
        passion: profileData.passion || '',
        aboutMe: profileData.aboutMe || '',
        profilePhotoUrl: profileData.profilePhotoUrl || '',
        bannerPhotoUrl: profileData.bannerPhotoUrl || '',
        skills: profileData.skills || [],
        interests: profileData.interests || [],
        followers: profileData.followers || 0,
        following: profileData.following || 0,
        connections: profileData.connections || 0,
        isVerified: profileData.isVerified || false,
        verifiedBadge: profileData.verifiedBadge || 'none',
        location: profileData.location || '',
        joinedDate: profileData.joinedDate || new Date(),
        createdAt: profileData.createdAt || new Date(),
        updatedAt: new Date(),
        pushToken: profileData.pushToken || '',
        // XP fields with defaults
        xp: profileData.xp ?? 0,
        level: profileData.level ?? 1,
        badges: profileData.badges ?? [],
        // lastLoginDate will be added conditionally below
        loginStreak: profileData.loginStreak ?? 0,
        lastActivityAt: profileData.lastActivityAt || new Date(),
        // lastDecayAppliedAt will be added conditionally below
        aiApiKey: profileData.aiApiKey || '',
        personality: profileData.personality || undefined,
        // Streak system fields
        streakCount: profileData.streakCount ?? 0,
        lastStreakWindowStart: profileData.lastStreakWindowStart || undefined,
        timezone: profileData.timezone || 'Asia/Kolkata',
      };

      // Only add optional fields if they have valid values (Firestore doesn't allow undefined)
      if (profileData.lastLoginDate) {
        (profile as any).lastLoginDate = profileData.lastLoginDate;
      }
      if (profileData.lastDecayAppliedAt) {
        (profile as any).lastDecayAppliedAt = profileData.lastDecayAppliedAt;
      }

      // Clean the profile object to remove undefined values before saving to Firestore
      const cleanedProfile = FirebaseUtils.cleanObjectForFirestore(profile);
      await setDoc(userRef, cleanedProfile, { merge: true });
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(uid: string): Promise<Profile | null> {
    try {
      console.log(`🔍 Fetching user profile for: ${uid}`);
      
      const userSnap = await getDoc(doc(db, 'users', uid));
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log(`📋 Raw user data:`, {
          uid: data.uid,
          name: data.name,
          profilePhotoUrl: data.profilePhotoUrl,
          bannerPhotoUrl: data.bannerPhotoUrl
        });

        // Clean up image URLs to handle local file paths and invalid URLs
        let profilePhotoUrl = data.profilePhotoUrl || '';
        let bannerPhotoUrl = data.bannerPhotoUrl || '';
        
        // Validate and clean profile photo URL
        try {
          if (!profilePhotoUrl || profilePhotoUrl.trim() === '' || profilePhotoUrl === 'undefined' || profilePhotoUrl === 'null') {
            console.log('📷 No profile photo URL, using default');
            profilePhotoUrl = ''; // Let Avatar component handle fallback
          } else if (ProfileImageService.isLocalFile(profilePhotoUrl)) {
            console.warn(`⚠️ Local file path detected for profile photo: ${profilePhotoUrl}`);
            profilePhotoUrl = ProfileImageService.getDefaultImageUrl('profile');
          } else {
            // Validate the URL format
            profilePhotoUrl = ProfileImageService.validateImageUrl(profilePhotoUrl);
          }
        } catch (error) {
          console.warn('Error processing profile photo URL:', error);
          profilePhotoUrl = ''; // Let Avatar component handle fallback
        }
        
        // Validate and clean banner photo URL  
        try {
          if (!bannerPhotoUrl || bannerPhotoUrl.trim() === '' || bannerPhotoUrl === 'undefined' || bannerPhotoUrl === 'null') {
            console.log('🖼️ No banner photo URL, using default');
            bannerPhotoUrl = ProfileImageService.getDefaultImageUrl('banner');
          } else if (ProfileImageService.isLocalFile(bannerPhotoUrl)) {
            console.warn(`⚠️ Local file path detected for banner photo: ${bannerPhotoUrl}`);
            bannerPhotoUrl = ProfileImageService.getDefaultImageUrl('banner');
          } else {
            // Validate the URL format
            bannerPhotoUrl = ProfileImageService.validateImageUrl(bannerPhotoUrl);
          }
        } catch (error) {
          console.warn('Error processing banner photo URL:', error);
          bannerPhotoUrl = ProfileImageService.getDefaultImageUrl('banner');
        }

        const profile: Profile = {
          uid: data.uid || uid,
          email: data.email || '',
          name: data.name || '',
          college: data.college || '',
          passion: data.passion || '',
          aboutMe: data.aboutMe || '',
          profilePhotoUrl,
          bannerPhotoUrl,
          skills: data.skills || [],
          interests: data.interests || [],
          followers: data.followers || 0,
          following: data.following || 0,
          connections: data.connections || 0,
          isVerified: data.isVerified || false,
          verifiedBadge: data.verifiedBadge || 'none',
          location: data.location || '',
          joinedDate: data.joinedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          pushToken: data.pushToken || '',
          socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
          // XP fields
          xp: data.xp ?? 0,
          level: data.level ?? 1,
          badges: data.badges || [],
          lastLoginDate: data.lastLoginDate?.toDate?.() || new Date(),
          loginStreak: data.loginStreak ?? 0,
          lastActivityAt: data.lastActivityAt?.toDate?.() || new Date(),
          lastDecayAppliedAt: data.lastDecayAppliedAt?.toDate?.() || new Date(),
          // Streak system fields
          streakCount: data.streakCount ?? 0,
          lastStreakWindowStart: data.lastStreakWindowStart || undefined,
          timezone: data.timezone || 'Asia/Kolkata',
        };

        console.log(`✅ Cleaned profile data:`, {
          uid: profile.uid,
          name: profile.name,
          profilePhotoUrl: profile.profilePhotoUrl,
          bannerPhotoUrl: profile.bannerPhotoUrl
        });

        return profile;
      }
      
      console.warn(`⚠️ User profile not found for uid: ${uid}`);
      return null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(uid: string, updates: Partial<Profile>): Promise<void> {
    try {
      // Clean the updates object to remove undefined values
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof Profile] !== undefined) {
          cleanUpdates[key] = updates[key as keyof Profile];
        }
      });

      // Add updatedAt timestamp
      cleanUpdates.updatedAt = new Date();

      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, cleanUpdates, { merge: true });

      // Update posts with new user data if profile fields that appear in posts were changed
      const postRelevantUpdates = {
        name: updates.name,
        college: updates.college,
        profilePhotoUrl: updates.profilePhotoUrl,
        verifiedBadge: updates.verifiedBadge
      };

      // Check if any post-relevant fields were updated
      const hasPostRelevantUpdates = Object.values(postRelevantUpdates).some(value => value !== undefined);
      
      if (hasPostRelevantUpdates) {
        try {
          await PostService.updateUserDataInPosts(uid, postRelevantUpdates);
          console.log(`✅ Updated user profile and synced posts for user: ${uid}`);
        } catch (postUpdateError) {
          // Don't fail the profile update if post sync fails
          console.warn(`⚠️ Profile updated but failed to sync posts for user ${uid}:`, postUpdateError);
        }
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async doesUserProfileExist(uid: string): Promise<boolean> {
    try {
      // Check both collections for backward compatibility
      const usersRef = doc(db, 'users', uid);
      const profilesRef = doc(db, 'profiles', uid);
      
      const [usersSnap, profilesSnap] = await Promise.all([
        getDoc(usersRef),
        getDoc(profilesRef)
      ]);
      
      return usersSnap.exists() || profilesSnap.exists();
    } catch (error) {
      console.error('Error checking if user profile exists:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<Profile[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: Profile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: data.uid || doc.id,
          email: data.email || '',
          name: data.name || '',
          college: data.college || '',
          passion: data.passion || '',
          aboutMe: data.aboutMe || '',
          profilePhotoUrl: data.profilePhotoUrl || '',
          bannerPhotoUrl: data.bannerPhotoUrl || '',
          skills: data.skills || [],
          interests: data.interests || [],
          followers: data.followers || 0,
          following: data.following || 0,
          connections: data.connections || 0,
          isVerified: data.isVerified || false,
          verifiedBadge: data.verifiedBadge || 'none',
          location: data.location || '',
          joinedDate: data.joinedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Profile);
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  static async searchUsers(searchQuery: string): Promise<Profile[]> {
    if (!searchQuery.trim()) {
      return [];
    }

    try {
      // Search by name (case-insensitive)
      const nameQuery = query(
        collection(db, 'users'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff')
      );

      const snapshot = await getDocs(nameQuery);
      const users: Profile[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: data.uid,
          email: data.email,
          name: data.name,
          college: data.college,
          passion: data.passion,
          aboutMe: data.aboutMe,
          profilePhotoUrl: data.profilePhotoUrl,
          bannerPhotoUrl: data.bannerPhotoUrl,
          skills: data.skills || [],
          interests: data.interests || [],
          followers: data.followers || 0,
          following: data.following || 0,
          connections: data.connections || 0,
          isVerified: data.isVerified || false,
          verifiedBadge: data.verifiedBadge || 'none',
          location: data.location,
          joinedDate: data.joinedDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      // Sort by relevance (exact matches first, then partial matches)
      users.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchQuery.toLowerCase();
        const bExact = b.name.toLowerCase() === searchQuery.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return a.name.localeCompare(b.name);
      });

      return users.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  static async getUserProfilesByIds(userIds: string[]): Promise<Profile[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    try {
      const profiles: Profile[] = [];
      
      // Process in batches to avoid Firestore limits
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
          try {
            const profile = await this.getUserProfile(userId);
            return profile;
          } catch (error) {
            console.warn(`Failed to fetch profile for user ${userId}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        profiles.push(...batchResults.filter((profile): profile is Profile => profile !== null));
      }
      
      return profiles;
    } catch (error) {
      console.error('Error getting user profiles by IDs:', error);
      throw error;
    }
  }

  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      console.log(`🗑️ Starting account deletion for user: ${userId}`);
      
      const batch = writeBatch(db);
      
      // 1. Delete user profile
      const userRef = doc(db, 'users', userId);
      batch.delete(userRef);
      
      // 2. Delete user's posts
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((postDoc) => {
        batch.delete(postDoc.ref);
      });
      
      // 3. Chat deletion removed - will be handled by new chat system
      
      // 4. Delete collaboration requests
      const collabQuery = query(
        collection(db, 'collaborationRequests'),
        where('senderId', '==', userId)
      );
      const collabSnapshot = await getDocs(collabQuery);
      collabSnapshot.forEach((collabDoc) => {
        batch.delete(collabDoc.ref);
      });
      
      // 5. Delete user reports
      const reportsQuery = query(
        collection(db, 'userReports'),
        where('reporterId', '==', userId)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      reportsSnapshot.forEach((reportDoc) => {
        batch.delete(reportDoc.ref);
      });
      
      // 6. Chat settings deletion removed - will be handled by new chat system
      
      // 7. Delete AI service data
      const aiServiceQuery = query(
        collection(db, 'aiService'),
        where('userId', '==', userId)
      );
      const aiServiceSnapshot = await getDocs(aiServiceQuery);
      aiServiceSnapshot.forEach((aiDoc) => {
        batch.delete(aiDoc.ref);
      });
      
      // 8. Delete follow relationships
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      const followSnapshot = await getDocs(followQuery);
      followSnapshot.forEach((followDoc) => {
        batch.delete(followDoc.ref);
      });
      
      // 9. Delete XP and achievements
      const xpQuery = query(
        collection(db, 'userXP'),
        where('userId', '==', userId)
      );
      const xpSnapshot = await getDocs(xpQuery);
      xpSnapshot.forEach((xpDoc) => {
        batch.delete(xpDoc.ref);
      });
      
      // 10. Delete search history
      const searchQuery = query(
        collection(db, 'searchHistory'),
        where('userId', '==', userId)
      );
      const searchSnapshot = await getDocs(searchQuery);
      searchSnapshot.forEach((searchDoc) => {
        batch.delete(searchDoc.ref);
      });
      
      // Execute all deletions in a single batch
      await batch.commit();
      
      console.log(`✅ Account deletion completed for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error deleting user account:', error);
      throw new Error('Failed to delete user account. Please try again.');
    }
  }
} 