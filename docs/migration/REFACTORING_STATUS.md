# Model Refactoring Status

**Date**: October 3, 2025  
**Goal**: Convert all interfaces to types, remove `any` usage, create `mg.ModelName` access pattern

---

## ✅ Completed Models (5/14)

### 1. ✅ User Model (`user.model.ts`)
- Converted all interfaces to types (UserPreferences, UserStats, UserXP, UserStreaks, etc.)
- Removed all `any` type usage
- Changed `IUser` → `UserDocument`
- Changed `IUserModel` → `UserModel`
- Added proper return types to all methods
- Fixed pre-save middleware with proper object initialization

### 2. ✅ Post Model (`post.model.ts`)
- Completely rewritten with types
- `IPost` → `PostDocument`
- `IPostModel` → `PostModel`
- No `any` types
- All methods properly typed

### 3. ✅ Comment Model (`comment.model.ts`)
- Completely rewritten with types
- `IComment` → `CommentDocument`
- `ICommentModel` → `CommentModel`
- No `any` types

### 4. ✅ Like Model (`like.model.ts`)
- Completely rewritten with types
- `ILike` → `LikeDocument`
- `ILikeModel` → `LikeModel`
- Proper error typing (no `any`)

### 5. ✅ Follow Model (`follow.model.ts`)
- Completely rewritten with types
- `IFollow` → `FollowDocument`
- `IFollowModel` → `FollowModel`
- Proper typing on all array methods

---

## ⏳ Remaining Models (9/14)

These models still need conversion following the same pattern:

### 6. ⏳ Chat Model (`chat.model.ts`)
**Changes needed**:
- `IChat` → `ChatDocument`
- `ILastMessage` → `LastMessage`
- `IChatModel` → `ChatModel`
- Remove `any` types in query methods

### 7. ⏳ Message Model (`message.model.ts`)
**Changes needed**:
- `IMessage` → `MessageDocument`
- `IMessageModel` → `MessageModel`
- Remove `any` types

### 8. ⏳ Notification Model (`notification.model.ts`)
**Changes needed**:
- `INotification` → `NotificationDocument`
- `INotificationModel` → `NotificationModel`
- Keep `NotificationType` as is (already a type)

### 9. ⏳ Room Model (`room.model.ts`)
**Changes needed**:
- `IRoom` → `RoomDocument`
- `IRoomModel` → `RoomModel`

### 10. ⏳ RoomMessage Model (`room-message.model.ts`)
**Changes needed**:
- `IRoomMessage` → `RoomMessageDocument`
- `IRoomMessageModel` → `RoomMessageModel`

### 11. ⏳ SpotlightPost Model (`spotlight-post.model.ts`)
**Changes needed**:
- `ISpotlightPost` → `SpotlightPostDocument`
- `ISpotlightPostModel` → `SpotlightPostModel`

### 12. ⏳ UserLocation Model (`user-location.model.ts`)
**Changes needed**:
- `IUserLocation` → `UserLocationDocument`
- `IUserLocationModel` → `UserLocationModel`
- Remove `any` types in scoring/matching methods

### 13. ⏳ Report Model (`report.model.ts`)
**Changes needed**:
- `IReport` → `ReportDocument`
- `IReportModel` → `ReportModel`
- Keep type aliases: `ReportReason`, `ReportStatus`, `ReportTargetType`

### 14. ⏳ CollaborationRequest Model (`collaboration-request.model.ts`)
**Changes needed**:
- `ICollaborationRequest` → `CollaborationRequestDocument`
- `ICollaborationRequestModel` → `CollaborationRequestModel`
- Keep `CollaborationStatus` type

---

## ✅ Infrastructure Complete

### ✅ config/models.ts Created
- Centralized model registry
- Access pattern: `import mg from '../config/models'`
- Usage: `mg.User.findById()`, `mg.Post.create()`, etc.
- Helper functions: `initializeModels()`, `getModelStats()`, `dropAllCollections()`

### ✅ index.ts Deleted
- Old index file removed
- All imports now use config/models.ts

---

## 🔧 Quick Conversion Guide

For each remaining model, follow this pattern:

### Step 1: Convert Interface Declarations
```typescript
// OLD
export interface ISomething {
  field: string;
}

// NEW
export type Something = {
  field: string;
};
```

### Step 2: Convert Main Document Interface
```typescript
// OLD
export interface IModelName extends Document {
  // fields...
  someMethod(): Promise<IModelName>;
}

// NEW
export type ModelNameDocument = Document & {
  // fields...
  someMethod(): Promise<ModelNameDocument>;
};
```

### Step 3: Update Schema Declaration
```typescript
// OLD
const Schema = new Schema<IModelName>({

// NEW
const Schema = new Schema<ModelNameDocument>({
```

### Step 4: Convert Model Interface
```typescript
// OLD
export interface IModelNameModel extends Model<IModelName> {
  staticMethod(): Promise<IModelName[]>;
}

// NEW
export type ModelNameModel = Model<ModelNameDocument> & {
  staticMethod(): Promise<ModelNameDocument[]>;
};
```

### Step 5: Update Model Export
```typescript
// OLD
const Model = mongoose.model<IModelName, IModelNameModel>('ModelName', Schema);

// NEW
const Model = mongoose.model<ModelNameDocument, ModelNameModel>('ModelName', Schema);
```

### Step 6: Remove `any` Types
```typescript
// OLD
const query: any = { ... };

// NEW
const query: Record<string, unknown> = { ... };

// OR specify exact type
const query: FilterQuery<ModelNameDocument> = { ... };
```

### Step 7: Fix Type Assertions
```typescript
// OLD
this.field = {} as IType;

// NEW
this.field = {
  // actual default values
};
```

---

## 📊 Progress Summary

- **Models Converted**: 5/14 (36%)
- **Models Remaining**: 9/14 (64%)
- **Infrastructure**: 100% Complete ✅
- **Compilation**: Partial (5 models compile cleanly)

---

## 🎯 Next Steps

1. **Option A**: Convert remaining models manually following the guide above
2. **Option B**: Run find/replace operations:
   ```bash
   # Example for chat.model.ts
   sed -i '' 's/IChat/ChatDocument/g' chat.model.ts
   sed -i '' 's/IChatModel/ChatModel/g' chat.model.ts
   # etc...
   ```

3. **Option C**: Use provided fully-converted examples as templates

---

## ✅ Testing

Once all models are converted:

```bash
cd apps/backend
npm run build
```

Expected result: 0 errors

---

## 📝 Usage Example

```typescript
// Import models
import mg from './config/models';

// Use models with mg.ModelName pattern
const user = await mg.User.findById(userId);
const posts = await mg.Post.getUserPosts(userId);
const followers = await mg.Follow.getFollowers(userId);

// Initialize indexes (call once on startup)
import { initializeModels } from './config/models';
await initializeModels();
```

---

**Status**: 36% Complete | 5/14 Models Converted  
**Next**: Convert remaining 9 models using the pattern above

