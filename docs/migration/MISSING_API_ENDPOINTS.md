# Missing API Endpoints Analysis

Based on mobile app services analysis, here are all the APIs needed:

## ✅ Already Implemented

### User APIs
- ✅ POST `/users/register` - Register user
- ✅ GET `/users/me` - Get current user
- ✅ PUT `/users/me` - Update user profile
- ✅ GET `/users/:id` - Get user by ID
- ✅ GET `/users/search` - Search users
- ✅ GET `/users/leaderboard` - Get leaderboard
- ✅ GET `/users/college/:college` - Get users by college

### Follow APIs
- ✅ POST `/users/:id/follow` - Follow user
- ✅ DELETE `/users/:id/follow` - Unfollow user
- ✅ GET `/users/:id/followers` - Get followers
- ✅ GET `/users/:id/following` - Get following

### Post APIs
- ✅ POST `/posts` - Create post
- ✅ GET `/posts/:id` - Get post
- ✅ PUT `/posts/:id` - Update post
- ✅ DELETE `/posts/:id` - Delete post
- ✅ GET `/posts/feed` - Get feed
- ✅ GET `/posts/trending` - Get trending
- ✅ GET `/posts/user/:userId` - Get user posts
- ✅ POST `/posts/:id/like` - Like/Unlike post
- ✅ POST `/posts/:id/reactions` - Add reaction
- ✅ GET `/posts/:id/comments` - Get comments
- ✅ POST `/posts/:id/comments` - Create comment

---

## ❌ Missing API Endpoints

### 1. Comment Management APIs
- ❌ PUT `/comments/:id` - Update comment
- ❌ DELETE `/comments/:id` - Delete comment
- ❌ POST `/comments/:id/like` - Like/Unlike comment
- ❌ GET `/comments/:id/replies` - Get comment replies

### 2. Chat/Messaging APIs
- ❌ GET `/chats` - Get user's chats list
- ❌ GET `/chats/:id` - Get chat by ID
- ❌ POST `/chats/direct` - Create direct chat
- ❌ POST `/chats/group` - Create group chat
- ❌ PUT `/chats/:id` - Update chat (name, icon)
- ❌ DELETE `/chats/:id` - Delete chat
- ❌ POST `/chats/:id/archive` - Archive chat
- ❌ DELETE `/chats/:id/archive` - Unarchive chat
- ❌ POST `/chats/:id/mute` - Mute chat
- ❌ DELETE `/chats/:id/mute` - Unmute chat
- ❌ POST `/chats/:id/members` - Add member to group
- ❌ DELETE `/chats/:id/members/:userId` - Remove member

### 3. Message APIs
- ❌ GET `/chats/:chatId/messages` - Get messages
- ❌ POST `/chats/:chatId/messages` - Send message
- ❌ PUT `/messages/:id` - Edit message
- ❌ DELETE `/messages/:id` - Delete message
- ❌ POST `/messages/:id/seen` - Mark message as seen

### 4. Room/Community APIs
- ❌ GET `/rooms` - Get public rooms
- ❌ GET `/rooms/my` - Get user's rooms
- ❌ POST `/rooms` - Create room
- ❌ GET `/rooms/:id` - Get room by ID
- ❌ PUT `/rooms/:id` - Update room
- ❌ DELETE `/rooms/:id` - Delete room
- ❌ POST `/rooms/:id/join` - Join room
- ❌ DELETE `/rooms/:id/leave` - Leave room
- ❌ POST `/rooms/:id/members/:userId/admin` - Make admin
- ❌ DELETE `/rooms/:id/members/:userId/admin` - Remove admin

### 5. Room Message APIs
- ❌ GET `/rooms/:roomId/messages` - Get room messages
- ❌ POST `/rooms/:roomId/messages` - Send room message
- ❌ DELETE `/room-messages/:id` - Delete room message

### 6. Spotlight APIs
- ❌ GET `/spotlight` - Get all spotlight posts
- ❌ GET `/spotlight/user/:userId` - Get user spotlight posts
- ❌ POST `/spotlight` - Create spotlight post
- ❌ GET `/spotlight/:id` - Get spotlight post
- ❌ PUT `/spotlight/:id` - Update spotlight post
- ❌ DELETE `/spotlight/:id` - Delete spotlight post
- ❌ POST `/spotlight/:id/like` - Like spotlight post
- ❌ POST `/spotlight/:id/comment` - Comment on spotlight
- ❌ GET `/spotlight/:id/comments` - Get spotlight comments

### 7. Notification APIs
- ❌ GET `/notifications` - Get user notifications
- ❌ GET `/notifications/unread-count` - Get unread count
- ❌ PUT `/notifications/:id/read` - Mark as read
- ❌ PUT `/notifications/read-all` - Mark all as read
- ❌ DELETE `/notifications/:id` - Delete notification
- ❌ DELETE `/notifications/clear-all` - Clear all notifications

### 8. Collaboration APIs
- ❌ GET `/collaborations` - Get collaboration requests
- ❌ POST `/collaborations` - Send collaboration request
- ❌ PUT `/collaborations/:id/accept` - Accept request
- ❌ PUT `/collaborations/:id/reject` - Reject request
- ❌ DELETE `/collaborations/:id` - Cancel request

### 9. Location APIs
- ❌ GET `/locations/nearby` - Get nearby creators
- ❌ POST `/locations` - Update location
- ❌ PUT `/locations/sharing` - Toggle location sharing
- ❌ GET `/locations/:userId` - Get user location

### 10. Report APIs
- ❌ POST `/reports` - Create report
- ❌ GET `/reports` - Get reports (admin)
- ❌ PUT `/reports/:id/review` - Review report
- ❌ PUT `/reports/:id/resolve` - Resolve report
- ❌ PUT `/reports/:id/dismiss` - Dismiss report

### 11. Search APIs
- ❌ GET `/search/all` - Global search (users, posts, rooms)
- ❌ GET `/search/posts` - Search posts
- ❌ GET `/search/history` - Get search history
- ❌ DELETE `/search/history` - Clear search history

### 12. XP/Gamification APIs
- ❌ GET `/users/:id/xp` - Get user XP details
- ❌ GET `/users/:id/badges` - Get user badges
- ❌ GET `/users/:id/streak` - Get user streak
- ❌ POST `/users/streak/check` - Check/update streak

### 13. File Upload APIs
- ❌ POST `/upload/image` - Upload image
- ❌ POST `/upload/video` - Upload video
- ❌ POST `/upload/file` - Upload file
- ❌ DELETE `/upload/:fileId` - Delete uploaded file

### 14. Follow Suggestions
- ❌ GET `/users/suggested` - Get suggested people to follow
- ❌ GET `/users/:id/mutual-followers` - Get mutual followers

### 15. Share APIs
- ❌ POST `/posts/:id/share` - Share post
- ❌ GET `/posts/:id/shares` - Get post shares count

---

## Priority Order for Implementation

### High Priority (Week 3 Phase 1)
1. Comment Management (4 endpoints)
2. Spotlight Posts (7 endpoints)
3. Notification System (6 endpoints)
4. Follow Suggestions (2 endpoints)
5. Share functionality (2 endpoints)

### Medium Priority (Week 3 Phase 2)
6. Chat/Messaging (11 endpoints)
7. Message APIs (5 endpoints)
8. Room/Community (8 endpoints)
9. Room Messages (3 endpoints)

### Lower Priority (Week 3 Phase 3)
10. Collaboration Requests (5 endpoints)
11. Location Services (4 endpoints)
12. Report System (5 endpoints)
13. XP/Gamification (4 endpoints)
14. File Upload (4 endpoints)
15. Search (3 endpoints)

---

## Total Count

- ✅ **Implemented:** 22 endpoints
- ❌ **Missing:** 71 endpoints
- **Total Required:** 93 endpoints

---

## Recommended Approach

**Phase 1 (High Priority)** - 21 endpoints
- Complete basic social features
- Enable content creation and discovery
- Implement notifications

**Phase 2 (Medium Priority)** - 27 endpoints
- Real-time messaging
- Community features
- Group interactions

**Phase 3 (Lower Priority)** - 23 endpoints
- Advanced features
- Admin tools
- File management

