import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Profile } from '../types';
import { UserService } from './userService';
import { FollowService } from './followService';

export interface SuggestedUser extends Profile {
  sharedSkills: string[];
  sharedInterests: string[];
  skillsToInterests: string[];
  interestsToSkills: string[];
  matchScore: number;
}

export class SuggestedPeopleService {
  static async getSuggestedPeople(
    currentUserId: string,
    options: {
      collegeFilter?: boolean;
      searchQuery?: string;
      skillFilters?: string[];
      interestFilters?: string[];
      limit?: number;
    } = {}
  ): Promise<SuggestedUser[]> {
    try {
      console.log('🔍 SuggestedPeopleService: Starting search for user:', currentUserId);
      
      const {
        collegeFilter = false,
        searchQuery = '',
        skillFilters = [],
        interestFilters = [],
        limit: resultLimit = 20
      } = options;

      console.log('📋 Search options:', {
        collegeFilter,
        searchQuery,
        skillFilters,
        interestFilters,
        resultLimit
      });

      // Get current user's profile
      const currentUser = await UserService.getUserProfile(currentUserId);
      if (!currentUser) {
        console.error('❌ Current user profile not found');
        throw new Error('Current user profile not found');
      }
      
      console.log('👤 Current user profile:', {
        name: currentUser.name,
        college: currentUser.college,
        skills: currentUser.skills?.length || 0,
        interests: currentUser.interests?.length || 0
      });

      // Get users that current user is following
      const following = await FollowService.getFollowingIds(currentUserId);
      console.log('👥 Users being followed:', following.length);

      // Build query for users - use the same approach as UserService.getAllUsers()
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      console.log('📊 Total users in database:', snapshot.docs.length);

      // Quick analysis of user profiles
      let usersWithSkills = 0;
      let usersWithInterests = 0;
      let usersWithBoth = 0;
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        const hasSkills = userData.skills && userData.skills.length > 0;
        const hasInterests = userData.interests && userData.interests.length > 0;
        
        if (hasSkills) usersWithSkills++;
        if (hasInterests) usersWithInterests++;
        if (hasSkills && hasInterests) usersWithBoth++;
      });

      console.log('👥 User profile analysis:', {
        total: snapshot.docs.length,
        usersWithSkills,
        usersWithInterests,
        usersWithBoth,
        currentUserSkills: (currentUser.skills || []).length,
        currentUserInterests: (currentUser.interests || []).length
      });

      const suggestedUsers: SuggestedUser[] = [];
      let processedCount = 0;
      let filteredCount = 0;

      for (const doc of snapshot.docs) {
        const userData = doc.data();
        processedCount++;
        
        // Skip if user is current user
        if (userData.uid === currentUserId) {
          continue;
        }
        
        // Skip if user is already being followed
        if (following.includes(userData.uid)) {
          continue;
        }

        // Apply case-insensitive search filter FIRST (like FindPeopleScreen)
        if (searchQuery.trim()) {
          const name = userData.name?.toLowerCase() || '';
          const skills = userData.skills?.map((s: string) => s.toLowerCase()) || [];
          const interests = userData.interests?.map((i: string) => i.toLowerCase()) || [];
          const searchLower = searchQuery.toLowerCase();
          
          const matchesName = name.includes(searchLower);
          const matchesSkills = skills.some((skill: string) => skill.includes(searchLower));
          const matchesInterests = interests.some((interest: string) => interest.includes(searchLower));
          
          if (!matchesName && !matchesSkills && !matchesInterests) {
            continue;
          }
        }

        const userProfile: Profile = {
          uid: userData.uid,
          email: userData.email || '',
          name: userData.name || '',
          college: userData.college || '',
          passion: userData.passion || '',
          aboutMe: userData.aboutMe || '',
          profilePhotoUrl: userData.profilePhotoUrl || '',
          bannerPhotoUrl: userData.bannerPhotoUrl || '',
          skills: userData.skills || [],
          interests: userData.interests || [],
          followers: userData.followers || 0,
          following: userData.following || 0,
          connections: userData.connections || 0,
          isVerified: userData.isVerified || false,
          verifiedBadge: userData.verifiedBadge || 'none',
          location: userData.location || '',
          joinedDate: userData.joinedDate?.toDate() || new Date(),
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };

        // Get current user's total items (skills + interests)
        const currentUserTotal = [
          ...(currentUser.skills || []),
          ...(currentUser.interests || [])
        ];
        
        // Get other user's total items (skills + interests)
        const otherUserTotal = [
          ...(userProfile.skills || []),
          ...(userProfile.interests || [])
        ];

        // Check if there's at least one match from ANY category
        // Your skills/interests vs their skills/interests (any combination)
        const yourSkills = currentUser.skills || [];
        const yourInterests = currentUser.interests || [];
        const theirSkills = userProfile.skills || [];
        const theirInterests = userProfile.interests || [];

        console.log(`🔍 Checking matches for ${userProfile.name}:`, {
          yourSkills: yourSkills.length,
          yourInterests: yourInterests.length,
          theirSkills: theirSkills.length,
          theirInterests: theirInterests.length
        });

        // Check all possible match combinations:
        // 1. Your skills match their skills
        const skillToSkillMatch = yourSkills.some(yourSkill => 
          theirSkills.some(theirSkill => 
            yourSkill.toLowerCase().trim() === theirSkill.toLowerCase().trim()
          )
        );

        // 2. Your interests match their interests  
        const interestToInterestMatch = yourInterests.some(yourInterest => 
          theirInterests.some(theirInterest => 
            yourInterest.toLowerCase().trim() === theirInterest.toLowerCase().trim()
          )
        );

        // 3. Your skills match their interests
        const skillToInterestMatch = yourSkills.some(yourSkill => 
          theirInterests.some(theirInterest => 
            yourSkill.toLowerCase().trim() === theirInterest.toLowerCase().trim()
          )
        );

        // 4. Your interests match their skills
        const interestToSkillMatch = yourInterests.some(yourInterest => 
          theirSkills.some(theirSkill => 
            yourInterest.toLowerCase().trim() === theirSkill.toLowerCase().trim()
          )
        );

        // Has ANY match from any combination
        const hasAnyMatch = skillToSkillMatch || interestToInterestMatch || skillToInterestMatch || interestToSkillMatch;

        // Debug logging for matches
        console.log(`🎯 Match results for ${userProfile.name}:`, {
          skillToSkillMatch,
          interestToInterestMatch,
          skillToInterestMatch,
          interestToSkillMatch,
          hasAnyMatch
        });

        // Only include users with at least one match
        if (hasAnyMatch) {
          // Apply college filter AFTER matching (only to users who have matches)
          if (collegeFilter && currentUser.college && userProfile.college !== currentUser.college) {
            continue;
          }

          // Apply skill filters AFTER matching (only to users who have matches)
          if (skillFilters.length > 0) {
            const userSkills = userProfile.skills || [];
            const hasMatchingSkill = skillFilters.some(skill => 
              userSkills.some((userSkill: string) => 
                userSkill.toLowerCase() === skill.toLowerCase()
              )
            );
            if (!hasMatchingSkill) {
              continue;
            }
          }

          // Apply interest filters AFTER matching (only to users who have matches)
          if (interestFilters.length > 0) {
            const userInterests = userProfile.interests || [];
            const hasMatchingInterest = interestFilters.some(interest => 
              userInterests.some((userInterest: string) => 
                userInterest.toLowerCase() === interest.toLowerCase()
              )
            );
            if (!hasMatchingInterest) {
              continue;
            }
          }

          // Calculate detailed matches for display and scoring using the same logic
          const sharedSkills = this.getSharedItems(yourSkills, theirSkills);
          const sharedInterests = this.getSharedItems(yourInterests, theirInterests);
          const skillsToInterests = this.getSharedItems(yourSkills, theirInterests);
          const interestsToSkills = this.getSharedItems(yourInterests, theirSkills);

          // Calculate match score: total matches / your total items (3 skills + 4 interests = 7)
          const totalMatches = sharedSkills.length + sharedInterests.length + 
                             skillsToInterests.length + interestsToSkills.length;
          const yourTotalItems = yourSkills.length + yourInterests.length;
          const matchScore = yourTotalItems > 0 ? totalMatches / yourTotalItems : 0;

          console.log(`📊 Match score for ${userProfile.name}:`, {
            sharedSkills: sharedSkills.length,
            sharedInterests: sharedInterests.length,
            skillsToInterests: skillsToInterests.length,
            interestsToSkills: interestsToSkills.length,
            totalMatches,
            yourTotalItems,
            matchScore: Math.round(matchScore * 100) + '%'
          });

          suggestedUsers.push({
            ...userProfile,
            sharedSkills,
            sharedInterests,
            skillsToInterests,
            interestsToSkills,
            matchScore,
          });
          filteredCount++;
          
          console.log(`✅ Match found: ${userProfile.name} - ${totalMatches} total matches`);
        }
      }
      
      console.log(`📈 Processing complete: ${processedCount} users processed, ${filteredCount} matches found`);

      // Sort by match score (highest first)
      suggestedUsers.sort((a, b) => b.matchScore - a.matchScore);

      // Return limited results
      return suggestedUsers.slice(0, resultLimit);
    } catch (error) {
      console.error('Error getting suggested people:', error);
      throw error;
    }
  }

  private static getSharedItems(userItems: string[], otherItems: string[]): string[] {
    const userItemsLower = userItems.map(item => item.toLowerCase());
    const otherItemsLower = otherItems.map(item => item.toLowerCase());
    
    return otherItems.filter(item => 
      userItemsLower.includes(item.toLowerCase())
    );
  }

  private static calculateMatchScore(
    sharedSkills: string[],
    sharedInterests: string[],
    skillsToInterests: string[],
    interestsToSkills: string[],
    totalUserSkills: number,
    totalUserInterests: number
  ): number {
    const directSkillScore = sharedSkills.length / Math.max(totalUserSkills, 1);
    const directInterestScore = sharedInterests.length / Math.max(totalUserInterests, 1);
    const crossSkillScore = skillsToInterests.length / Math.max(totalUserSkills, 1);
    const crossInterestScore = interestsToSkills.length / Math.max(totalUserInterests, 1);
    
    // Weight all types of matches equally
    return (directSkillScore + directInterestScore + crossSkillScore + crossInterestScore) / 4;
  }

  static async getAllSkills(): Promise<string[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const allSkills = new Set<string>();
      snapshot.docs.forEach(doc => {
        const skills = doc.data().skills || [];
        skills.forEach((skill: string) => allSkills.add(skill.toLowerCase()));
      });
      
      return Array.from(allSkills).sort();
    } catch (error) {
      console.error('Error getting all skills:', error);
      return [];
    }
  }

  static async getAllInterests(): Promise<string[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const allInterests = new Set<string>();
      snapshot.docs.forEach(doc => {
        const interests = doc.data().interests || [];
        interests.forEach((interest: string) => allInterests.add(interest.toLowerCase()));
      });
      
      return Array.from(allInterests).sort();
    } catch (error) {
      console.error('Error getting all interests:', error);
      return [];
    }
  }
} 