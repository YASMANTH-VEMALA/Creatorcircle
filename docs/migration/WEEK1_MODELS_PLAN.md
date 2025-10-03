# Week 1: MongoDB Models Creation - Implementation Plan

**Date**: October 3, 2025  
**Phase**: Firebase to MongoDB Migration  
**Duration**: Week 1 of 3-week migration plan  
**Status**: 🔄 In Progress

---

## 📋 Week Overview

### **Goal**: Create all Mongoose models for MongoDB database

### **Context**
- ✅ Express.js + TypeScript server setup complete
- ✅ MongoDB connection configured
- ✅ Shared types package available
- 🎯 Now creating Mongoose schemas for all app features

### **Three-Week Migration Plan**
```
Week 1: Backend Setup & Models Creation  ← WE ARE HERE
Week 2: API Development (Auth, Users, Posts APIs)
Week 3: Mobile Migration (Replace Firebase calls)
```

---

## 🗄️ Models Architecture

### **Total Models**: 15 comprehensive models

### **Model Categories**

#### **1. Core User Models** (Priority: CRITICAL)
- **User Model** - Main user/profile data with embedded subdocuments
  - UserPreferences subdocument
  - UserStats subdocument
  - UserActivity subdocument
  - UserXP subdocument
  - UserStreaks subdocument
  - UserAuth subdocument
  - UserLocation subdocument
  - SocialLinks array

#### **2. Social Interaction Models** (Priority: HIGH)
- **Post Model** - User posts with media, reactions, metrics
- **Comment Model** - Comments with replies and likes
- **Like Model** - Post and comment likes
- **Follow Model** - User follow relationships

#### **3. Communication Models** (Priority: HIGH)
- **Chat Model** - 1-on-1 conversation metadata
- **Message Model** - Chat messages with media
- **Notification Model** - All notification types

#### **4. Feature-Specific Models** (Priority: MEDIUM)
- **Room Model** - Group chat rooms
- **RoomMessage Model** - Room chat messages
- **SpotlightPost Model** - Short video posts (like TikTok)
- **UserLocation Model** - Real-time location sharing

#### **5. Moderation & Premium Models** (Priority: MEDIUM)
- **Report Model** - Content reporting system
- **Banner Model** - Premium user banners
- **CollaborationRequest Model** - Partnership requests

---

## 📐 Model Specifications

### **1. User Model** (`user.model.ts`)

**Purpose**: Central user profile with all user-related data

**Schema Structure**:
```javascript
{
  // Basic Info (from Firebase Auth + Profile)
  uid: String (unique, indexed) // Firebase Auth UID
  email: String (unique, required)
  name: String (required)
  college: String (required)
  passion: String
  aboutMe: String
  
  // Media
  profilePhotoUrl: String
  bannerPhotoUrl: String
  banners: [Banner subdocument] // Up to 5 for premium users
  
  // Skills & Interests
  skills: [String]
  interests: [String]
  
  // Social Links
  socialLinks: [{
    platform: enum['youtube', 'instagram', 'linkedin', 'twitter', 'facebook', 'github', 'tiktok', 'website']
    url: String
  }]
  
  // Verification & Premium
  isVerified: Boolean (default: false)
  verifiedBadge: enum['none', 'silver', 'gold'] (default: 'none')
  isPremium: Boolean (default: false)
  premiumExpiry: Date
  
  // Stats (embedded)
  stats: {
    postsCount: Number (default: 0)
    followersCount: Number (default: 0)
    followingCount: Number (default: 0)
    connectionsCount: Number (default: 0)
    likesReceived: Number (default: 0)
    commentsReceived: Number (default: 0)
  }
  
  // XP & Gamification (embedded)
  xp: {
    xp: Number (default: 0)
    level: Number (default: 1)
    badges: [String]
    lastDecayAppliedAt: Date
  }
  
  // Streak System (embedded)
  streaks: {
    streakCount: Number (default: 0)
    lastStreakWindowStart: String // ISO date string
    timezone: String (default: 'Asia/Kolkata')
    bestStreak: Number (default: 0)
  }
  
  // Activity Tracking (embedded)
  activity: {
    lastLoginDate: Date
    loginStreak: Number (default: 0)
    lastActivityAt: Date (default: now)
    totalSessions: Number (default: 0)
    averageSessionDuration: Number (default: 0)
  }
  
  // Preferences (embedded)
  preferences: {
    theme: enum['light', 'dark', 'auto'] (default: 'auto')
    notifications: Boolean (default: true)
    locationSharing: Boolean (default: false)
    language: String (default: 'en')
    timezone: String (default: 'Asia/Kolkata')
  }
  
  // AI & Personality
  aiApiKey: String (encrypted)
  personality: enum['introvert', 'extrovert', 'ambivert']
  
  // Location (embedded - for profile location, not real-time)
  location: {
    city: String
    country: String
    address: String
  }
  
  // Push Notifications
  pushToken: String
  
  // Timestamps
  joinedDate: Date (default: now)
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
}
```

**Indexes**:
- `uid` (unique)
- `email` (unique)
- `name` (text search)
- `college` (filtering)
- `skills` (array filtering)
- `interests` (array filtering)
- `xp.level` (leaderboard)
- `stats.followersCount` (sorting)

---

### **2. Post Model** (`post.model.ts`)

**Purpose**: User-generated posts with media, reactions, and analytics

**Schema Structure**:
```javascript
{
  userId: ObjectId (ref: 'User', required, indexed)
  
  // Content
  content: String (required, max: 5000)
  emoji: String
  
  // Media (AWS S3 URLs)
  images: [String] // max 10
  videos: [String] // max 3
  
  // Engagement Metrics
  likes: Number (default: 0)
  comments: Number (default: 0)
  shares: Number (default: 0)
  views: Number (default: 0)
  saves: Number (default: 0)
  
  // Reactions
  reactions: Map (emoji -> count)
  
  // Moderation
  reports: Number (default: 0)
  isModerated: Boolean (default: false)
  isHidden: Boolean (default: false)
  moderationFlags: [String]
  moderatedAt: Date
  moderatedBy: ObjectId (ref: 'User')
  moderationReason: String
  
  // Status
  isEdited: Boolean (default: false)
  isDeleted: Boolean (default: false)
  
  // Timestamps
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
  editedAt: Date
}
```

**Virtual Fields**:
- `user` - populate user details
- `engagementRate` - calculated field

**Indexes**:
- `userId` (filtering)
- `createdAt` (sorting, descending)
- `likes` (sorting)
- `isHidden`, `isDeleted` (filtering)

---

### **3. Comment Model** (`comment.model.ts`)

**Purpose**: Comments on posts with reply threading

**Schema Structure**:
```javascript
{
  postId: ObjectId (ref: 'Post', required, indexed)
  userId: ObjectId (ref: 'User', required, indexed)
  
  // Content
  content: String (required, max: 1000)
  
  // Reply Threading
  replyToCommentId: ObjectId (ref: 'Comment')
  replyToUserId: ObjectId (ref: 'User')
  
  // Engagement
  likes: Number (default: 0)
  repliesCount: Number (default: 0)
  
  // Status
  isEdited: Boolean (default: false)
  isDeleted: Boolean (default: false)
  
  // Timestamps
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
  editedAt: Date
}
```

**Indexes**:
- `postId` (filtering)
- `userId` (user's comments)
- `replyToCommentId` (threading)
- `createdAt` (sorting)

---

### **4. Like Model** (`like.model.ts`)

**Purpose**: Track likes on posts and comments

**Schema Structure**:
```javascript
{
  userId: ObjectId (ref: 'User', required, indexed)
  targetType: enum['post', 'comment'] (required)
  targetId: ObjectId (required, indexed) // Post or Comment ID
  
  // Timestamps
  createdAt: Date (default: now)
}
```

**Compound Indexes**:
- `{userId, targetType, targetId}` (unique) - prevent duplicate likes
- `{targetId, targetType}` - count likes for a target

---

### **5. Follow Model** (`follow.model.ts`)

**Purpose**: User follow relationships

**Schema Structure**:
```javascript
{
  followerId: ObjectId (ref: 'User', required, indexed)
  followingId: ObjectId (ref: 'User', required, indexed)
  
  // Cached data for performance
  followerName: String
  followerCollege: String
  followerProfilePic: String
  followingName: String
  followingCollege: String
  followingProfilePic: String
  
  // Timestamps
  followedAt: Date (default: now)
}
```

**Compound Indexes**:
- `{followerId, followingId}` (unique)
- `{followingId}` - get followers
- `{followerId}` - get following

---

### **6. Chat Model** (`chat.model.ts`)

**Purpose**: 1-on-1 conversation metadata

**Schema Structure**:
```javascript
{
  participants: [ObjectId] (ref: 'User', required, size: 2)
  
  // Last Message (denormalized for performance)
  lastMessage: {
    content: String
    senderId: ObjectId (ref: 'User')
    messageType: enum['text', 'image', 'video', 'file']
    timestamp: Date
  }
  
  // Group Chat (for future)
  isGroupChat: Boolean (default: false)
  groupName: String
  groupImage: String
  
  // Status
  isArchived: Boolean (default: false)
  archivedBy: [ObjectId] (ref: 'User')
  
  // Timestamps
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
}
```

**Indexes**:
- `participants` (array, finding chats)
- `updatedAt` (sorting by recent activity)

---

### **7. Message Model** (`message.model.ts`)

**Purpose**: Individual chat messages

**Schema Structure**:
```javascript
{
  chatId: ObjectId (ref: 'Chat', required, indexed)
  senderId: ObjectId (ref: 'User', required, indexed)
  receiverId: ObjectId (ref: 'User', required, indexed)
  
  // Content
  text: String (max: 5000)
  messageType: enum['text', 'image', 'video', 'file'] (required)
  
  // Media (AWS S3 URLs)
  mediaUrl: String
  fileName: String
  fileSize: Number
  
  // Status
  isSeen: Boolean (default: false)
  isEdited: Boolean (default: false)
  isDeleted: Boolean (default: false)
  
  // Timestamps
  timestamp: Date (default: now)
  seenAt: Date
  editedAt: Date
}
```

**Indexes**:
- `chatId, timestamp` (compound, chat history)
- `senderId` (user's sent messages)
- `receiverId, isSeen` (unread messages)

---

### **8. Notification Model** (`notification.model.ts`)

**Purpose**: All types of notifications

**Schema Structure**:
```javascript
{
  type: enum[
    'like', 'comment', 'comment_reply', 'comment_like',
    'follow', 'collab_request', 'request_accepted', 'request_rejected',
    'message', 'report_warning', 'mention', 'badge_earned'
  ] (required)
  
  toUserId: ObjectId (ref: 'User', required, indexed)
  fromUserId: ObjectId (ref: 'User', indexed)
  
  // Cached sender data
  senderName: String
  senderProfilePic: String
  senderVerified: Boolean
  
  // Related entities
  relatedPostId: ObjectId (ref: 'Post')
  relatedCommentId: ObjectId (ref: 'Comment')
  relatedChatId: ObjectId (ref: 'Chat')
  
  // Content
  message: String
  commentText: String
  
  // Status
  isRead: Boolean (default: false)
  
  // Timestamps
  createdAt: Date (default: now, indexed)
  readAt: Date
}
```

**Indexes**:
- `toUserId, isRead` (unread notifications)
- `toUserId, createdAt` (user's notifications, sorted)

---

### **9. Room Model** (`room.model.ts`)

**Purpose**: Group chat rooms

**Schema Structure**:
```javascript
{
  name: String (required)
  description: String
  
  // Privacy
  isPrivate: Boolean (default: false)
  password: String (hashed)
  
  // Media
  logoUrl: String
  
  // Members
  creatorId: ObjectId (ref: 'User', required)
  admins: [ObjectId] (ref: 'User')
  members: [ObjectId] (ref: 'User')
  membersCount: Number (default: 0)
  
  // Temporary Rooms
  isTemporary: Boolean (default: false)
  endsAt: Date
  
  // Status
  isActive: Boolean (default: true)
  
  // Timestamps
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
}
```

**Indexes**:
- `creatorId` (rooms by creator)
- `members` (rooms by member)
- `isPrivate` (public rooms)
- `isTemporary, endsAt` (cleanup)

---

### **10. RoomMessage Model** (`room-message.model.ts`)

**Purpose**: Messages in group rooms

**Schema Structure**:
```javascript
{
  roomId: ObjectId (ref: 'Room', required, indexed)
  senderId: ObjectId (ref: 'User', required, indexed)
  
  // Content
  text: String (max: 5000)
  messageType: enum['text', 'image', 'video', 'file', 'system']
  
  // Media
  mediaUrl: String
  
  // Status
  isDeleted: Boolean (default: false)
  
  // Timestamps
  timestamp: Date (default: now)
}
```

**Indexes**:
- `roomId, timestamp` (room chat history)

---

### **11. SpotlightPost Model** (`spotlight-post.model.ts`)

**Purpose**: Short video posts (TikTok-style)

**Schema Structure**:
```javascript
{
  creatorId: ObjectId (ref: 'User', required, indexed)
  
  // Video
  videoUrl: String (required) // AWS S3
  thumbnailUrl: String
  caption: String (max: 500)
  
  // Metrics
  likesCount: Number (default: 0)
  commentsCount: Number (default: 0)
  viewsCount: Number (default: 0)
  sharesCount: Number (default: 0)
  
  // Status
  isFeatured: Boolean (default: false)
  isPublic: Boolean (default: true)
  isDeleted: Boolean (default: false)
  
  // Timestamps
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
}
```

**Indexes**:
- `creatorId` (creator's spotlights)
- `isFeatured, createdAt` (featured content)
- `viewsCount` (trending)

---

### **12. UserLocation Model** (`user-location.model.ts`)

**Purpose**: Real-time location sharing for nearby creators

**Schema Structure**:
```javascript
{
  userId: ObjectId (ref: 'User', required, unique, indexed)
  
  // Location (GeoJSON for geospatial queries)
  location: {
    type: 'Point'
    coordinates: [Number] // [longitude, latitude]
  }
  
  // Cached user data
  displayName: String
  college: String
  skills: [String]
  interests: [String]
  verified: Boolean
  photoURL: String
  
  // Status
  isLocationShared: Boolean (default: true)
  
  // Timestamps
  lastUpdated: Date (default: now)
}
```

**Geospatial Index**:
- `location` (2dsphere) - for nearby queries

---

### **13. Report Model** (`report.model.ts`)

**Purpose**: Content moderation and reporting

**Schema Structure**:
```javascript
{
  reporterId: ObjectId (ref: 'User', required, indexed)
  
  // Target
  targetType: enum['post', 'comment', 'user', 'spotlight']
  targetId: ObjectId (required, indexed)
  
  // Report Details
  reason: enum['spam', 'offensive', 'fake', 'inappropriate', 'harassment', 'other']
  description: String (max: 1000)
  
  // Status
  status: enum['pending', 'reviewed', 'resolved', 'dismissed']
  reviewedBy: ObjectId (ref: 'User')
  reviewedAt: Date
  actionTaken: String
  
  // Timestamps
  createdAt: Date (default: now)
}
```

**Indexes**:
- `targetType, targetId` (reports for a target)
- `status` (pending reports)
- `reporterId` (user's reports)

---

### **14. Banner Model** (`banner.model.ts`)

**Purpose**: Premium user profile banners

**Schema Structure**:
```javascript
{
  userId: ObjectId (ref: 'User', required, indexed)
  
  // Content
  imageUrl: String (required) // AWS S3
  title: String
  description: String
  
  // Display
  order: Number (default: 0)
  isActive: Boolean (default: true)
  
  // Timestamps
  createdAt: Date (default: now)
  updatedAt: Date (default: now, auto-update)
}
```

**Indexes**:
- `userId, order` (user's banners, sorted)
- `isActive` (active banners)

**Constraint**: Max 5 banners per premium user (enforced in API)

---

### **15. CollaborationRequest Model** (`collaboration-request.model.ts`)

**Purpose**: Partnership requests between creators

**Schema Structure**:
```javascript
{
  senderId: ObjectId (ref: 'User', required, indexed)
  receiverId: ObjectId (ref: 'User', required, indexed)
  
  // Cached sender data
  senderName: String
  senderAvatar: String
  senderCollege: String
  
  // Request Details
  message: String (max: 1000)
  
  // Status
  status: enum['pending', 'accepted', 'rejected'] (default: 'pending')
  
  // Timestamps
  createdAt: Date (default: now)
  respondedAt: Date
}
```

**Indexes**:
- `receiverId, status` (pending requests)
- `senderId` (sent requests)

---

## 🛠️ Implementation Strategy

### **Day-by-Day Breakdown**

#### **Tasks 1-2: Core User Model** (2 hours)
- Create User model with all subdocuments
- Add indexes and validation
- Create helper methods (XP calculation, level up, etc.)

#### **Tasks 3: Social Models** (1.5 hours)
- Post, Comment, Like, Follow models
- Add relationships and indexes

#### **Task 4: Communication Models** (1 hour)
- Chat, Message, Notification models
- Real-time considerations

#### **Task 5: Feature Models** (1 hour)
- Room, RoomMessage, SpotlightPost, UserLocation
- Geospatial indexing for locations

#### **Task 6: Moderation Models** (30 minutes)
- Report, Banner, CollaborationRequest
- Admin functionality support

#### **Task 7: Model Index & Utilities** (30 minutes)
- Central model export
- Validation utilities
- Model helper functions

#### **Task 8: Testing** (30 minutes)
- Compilation tests
- Build verification
- Sample data insertion tests

---

## 📝 Model Best Practices

### **1. Timestamps**
- Every model has `createdAt` and `updatedAt`
- Use Mongoose timestamps option

### **2. Soft Deletes**
- Use `isDeleted` flag instead of actual deletion
- Helps with data recovery and auditing

### **3. Denormalization**
- Cache frequently accessed data (user names, photos)
- Reduces join queries for better performance

### **4. Indexes**
- Index all foreign keys
- Index fields used in queries and sorts
- Use compound indexes for common query patterns

### **5. Validation**
- Use Mongoose validators
- Add custom validation for business logic
- Validate at both model and API levels

### **6. Virtuals & Methods**
- Add virtual fields for computed data
- Instance methods for entity-specific operations
- Static methods for queries

### **7. Hooks/Middleware**
- Pre-save hooks for data transformation
- Post-save hooks for cascading operations
- Use for maintaining counters and caches

---

## 🎯 Success Criteria

### **Week 1 Completion Checklist**

- [ ] All 15 models created with complete schemas
- [ ] All indexes properly defined
- [ ] Validation rules implemented
- [ ] Model relationships configured
- [ ] TypeScript compilation successful (0 errors)
- [ ] Build process working
- [ ] Models exported from central index
- [ ] Documentation comments added
- [ ] Sample model instances can be created
- [ ] Ready for Week 2 API development

---

## 📊 Migration Progress

```
OVERALL MIGRATION: Week 1 of 3

✅ Phase 0: Monorepo Setup (100%)
🔄 Phase 1: Backend Setup (75%)
   ✅ Express.js server (100%)
   ✅ MongoDB connection (100%)
   🔄 Mongoose models (0% → Target: 100%)
⏳ Phase 2: API Development (0%)
⏳ Phase 3: Mobile Migration (0%)
```

---

## 🔜 Next Steps (Week 2)

After completing Week 1 models:

1. **Authentication Middleware** - Firebase Auth verification
2. **User APIs** - Registration, profile, search
3. **Post APIs** - CRUD operations, feed generation
4. **Social APIs** - Follow, like, comment
5. **Chat APIs** - Real-time messaging setup
6. **File Upload** - AWS S3 integration
7. **Testing** - API endpoint testing

---

**Document Status**: ✅ Ready for Implementation  
**Next Action**: Start creating models (Task 1)  
**Estimated Completion**: End of Week 1

---

*This plan will be updated as implementation progresses.*

