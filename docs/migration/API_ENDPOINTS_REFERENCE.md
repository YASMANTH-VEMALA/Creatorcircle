# CreatorCircle API Endpoints Reference

Base URL: `http://localhost:5000/api/v1`

---

## Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

---

## User Endpoints

### Register User
```http
POST /users/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "college": "MIT",
  "passion": "Software Development",
  "aboutMe": "Passionate developer",
  "skills": ["JavaScript", "TypeScript", "React"],
  "interests": ["AI", "Web3", "Gaming"],
  "profilePhotoUrl": "https://example.com/photo.jpg"
}
```

### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "aboutMe": "Updated bio",
  "skills": ["JavaScript", "Python"],
  "personality": "extrovert"
}
```

### Get User by ID
```http
GET /users/:id
```

### Search Users
```http
GET /users/search?q=javascript&page=1&limit=20
```

### Get Leaderboard
```http
GET /users/leaderboard?limit=100
```

### Get Users by College
```http
GET /users/college/MIT?page=1&limit=20
```

### Follow User
```http
POST /users/:id/follow
Authorization: Bearer <token>
```

### Unfollow User
```http
DELETE /users/:id/follow
Authorization: Bearer <token>
```

### Get User Followers
```http
GET /users/:id/followers?page=1&limit=20
```

### Get User Following
```http
GET /users/:id/following?page=1&limit=20
```

---

## Post Endpoints

### Create Post
```http
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Check out my latest project!",
  "emoji": "🚀",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "videos": [
    "https://example.com/video1.mp4"
  ]
}
```

### Get Post by ID
```http
GET /posts/:id
Authorization: Bearer <token> (optional)
```

### Update Post
```http
PUT /posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content",
  "emoji": "🎉"
}
```

### Delete Post
```http
DELETE /posts/:id
Authorization: Bearer <token>
```

### Get Feed
```http
GET /posts/feed?page=1&limit=20
Authorization: Bearer <token>
```

### Get Trending Posts
```http
GET /posts/trending?hours=24&limit=20
```

### Get User Posts
```http
GET /posts/user/:userId?page=1&limit=20
```

### Like/Unlike Post
```http
POST /posts/:id/like
Authorization: Bearer <token>
```

### Add Reaction
```http
POST /posts/:id/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "emoji": "❤️"
}
```

### Get Post Comments
```http
GET /posts/:id/comments?page=1&limit=20
```

### Create Comment
```http
POST /posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great post!",
  "replyToCommentId": "optional_comment_id"
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Error description"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid request data",
  "errors": [
    {
      "code": "too_small",
      "minimum": 2,
      "message": "String must contain at least 2 character(s)",
      "path": ["name"]
    }
  ]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `ValidationError` | 400 | Request validation failed |
| `Unauthorized` | 401 | Authentication required |
| `Forbidden` | 403 | Insufficient permissions |
| `NotFound` | 404 | Resource not found |
| `Conflict` | 409 | Resource already exists |
| `InternalServerError` | 500 | Server error |

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Headers:**
  - `RateLimit-Limit`: Maximum requests
  - `RateLimit-Remaining`: Remaining requests
  - `RateLimit-Reset`: Reset timestamp

---

## Testing with cURL

### Register and Get Profile
```bash
# 1. Register (replace TOKEN with your Firebase token)
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","college":"MIT","passion":"Coding"}'

# 2. Get your profile
curl http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Post and Like
```bash
# 1. Create post
curl -X POST http://localhost:5000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello World!","emoji":"👋"}'

# 2. Like post (replace POST_ID)
curl -X POST http://localhost:5000/api/v1/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search and Follow
```bash
# 1. Search users
curl "http://localhost:5000/api/v1/users/search?q=john"

# 2. Follow user (replace USER_ID)
curl -X POST http://localhost:5000/api/v1/users/USER_ID/follow \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get feed
curl http://localhost:5000/api/v1/posts/feed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "CreatorCircle API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "token",
      "value": "YOUR_FIREBASE_TOKEN"
    }
  ],
  "item": [
    {
      "name": "Users",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/users/register",
            "body": {
              "mode": "raw",
              "raw": "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"college\":\"MIT\",\"passion\":\"Coding\"}"
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/users/me"
          }
        }
      ]
    },
    {
      "name": "Posts",
      "item": [
        {
          "name": "Create Post",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/posts",
            "body": {
              "mode": "raw",
              "raw": "{\"content\":\"My first post!\",\"emoji\":\"🚀\"}"
            }
          }
        },
        {
          "name": "Get Feed",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/posts/feed"
          }
        }
      ]
    }
  ]
}
```

---

## Notes

1. **Firebase Token:** Get from Firebase Authentication in your mobile app
2. **MongoDB IDs:** All IDs are MongoDB ObjectIds (24-character hex strings)
3. **Pagination:** Default is 20 items per page, max is 100
4. **File Uploads:** Currently expects pre-uploaded URLs (implement file upload endpoint separately)
5. **Soft Deletes:** Posts are soft-deleted (marked as deleted, not removed from database)

