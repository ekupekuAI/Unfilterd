# PRODUCT_REQUIREMENTS

## Product Overview

UNFILTERD is an anonymous social platform centered on expressive text posts, lightweight identity, community interaction, and moderation.
The MVP focuses on secure access, anonymous posting, content discovery, engagement, and platform safety.

## Product Goals

- Allow users to express thoughts anonymously with low friction
- Support recurring engagement through feed, comments, likes, and saves
- Preserve user safety with reporting and moderation tools
- Provide a minimal but usable identity layer through anonymous profiles
- Create a clean foundation for future expansion into AI, chat, communities, and monetization

## Target Users

- Users who want to share personal thoughts without real-name identity pressure
- Users who want to browse mood-based or interest-based anonymous content
- Moderators/admins who need to review harmful or abusive content

## Scope

### MVP Features

- Authentication
- Anonymous posting
- Feed
- Comments
- Likes
- Saved posts
- Reports
- Profile
- Notifications
- Admin moderation

### Non-MVP Features

- AI recommendations
- Real-time chat
- Communities
- Premium subscriptions

## Functional Requirements

### 1. Authentication

#### Requirements

- Users must be able to create an account with email and password.
- Users must be able to sign in with email and password.
- Users must remain signed in across sessions until they explicitly sign out or the session expires.
- Unauthenticated users must not access protected application pages.
- Each authenticated user must have an associated profile record.

#### User Flow

1. User opens the app.
2. If not authenticated, user is sent to login or registration.
3. User creates an account or signs in.
4. System creates or loads the user profile.
5. User enters the authenticated app experience.

### 2. Anonymous Posting

#### Requirements

- Authenticated users must be able to create a new post.
- A post must contain a title, body content, and mood/category tag.
- Posts must display anonymous-style identity rather than exposing private account details.
- The system may show content warnings before publishing if harmful language is detected.
- Published posts must be stored with author linkage for permissions and moderation.

#### User Flow

1. User opens the post creation screen.
2. User selects a mood.
3. User enters title and content.
4. System optionally warns about harmful language or suggests a mood.
5. User publishes the post.
6. User is redirected to the created post.

### 3. Feed

#### Requirements

- Users must be able to browse a feed of posts after signing in.
- Feed must support at least:
  - latest posts
  - trending posts
  - followed users’ posts
- Feed should support filtering by mood.
- Each feed item must expose core engagement actions:
  - view
  - like
  - save
  - share
  - report

#### User Flow

1. User opens the home feed.
2. User chooses a feed mode such as latest, trending, or following.
3. User optionally filters by mood.
4. User browses posts and opens a post for more detail if needed.

### 4. Comments

#### Requirements

- Users must be able to add comments to posts.
- Users must be able to reply to comments.
- The system must support nested comment relationships.
- Users must be able to delete their own comments.
- Comment counts must update on the related post.

#### User Flow

1. User opens a post detail page.
2. User writes a comment or selects reply on an existing comment.
3. User submits the comment.
4. System stores the comment and refreshes the thread.

### 5. Likes

#### Requirements

- Users must be able to like a post.
- Users must be able to remove a like from a post.
- Like counts must update consistently.
- Post owners should receive notifications for likes from other users.

#### User Flow

1. User sees a post in feed or detail view.
2. User taps like.
3. System stores the like and updates the count.
4. If the liker is not the post owner, the owner receives a notification.

### 6. Saved Posts

#### Requirements

- Users must be able to save a post.
- Users must be able to unsave a post.
- Users must have a dedicated view for saved posts in their profile area.
- Saved posts must be private to the saving user.

#### User Flow

1. User taps save on a post.
2. System records the save for that user.
3. User later opens profile and views the saved posts tab.

### 7. Reports

#### Requirements

- Users must be able to report harmful, abusive, or inappropriate content.
- A report must capture:
  - reporting user
  - target content
  - reason
  - optional description
- Report status must be trackable by the moderation system.
- Regular users should only have access to their own submitted reports, if exposed.

#### User Flow

1. User opens the action menu on a post.
2. User chooses report.
3. User selects a reason and optional description.
4. System stores the report for moderation review.

### 8. Profile

#### Requirements

- Users must have a profile page tied to their account.
- Profile must display key account and activity metadata.
- Users must be able to edit basic profile fields such as username and bio.
- Profile must provide access to:
  - own posts
  - saved posts
  - liked posts
  - settings
- Users must be able to sign out from the profile/settings area.

#### User Flow

1. User opens the profile page.
2. User reviews profile info and content tabs.
3. User optionally edits username or bio.
4. User saves changes and sees the updated profile state.

### 9. Notifications

#### Requirements

- Users must receive notifications for relevant activity on their content.
- Supported notification types for MVP should include:
  - like
  - comment
  - reply
  - system message
- Users must be able to view recent notifications.
- Users must be able to mark notifications as read.
- Users must be able to mark all notifications as read.

#### User Flow

1. Another user interacts with a post or comment.
2. System generates a notification for the affected user.
3. User opens the notifications page.
4. User reads items and marks one or all as read.

### 10. Admin Moderation

#### Requirements

- Admin users must have access to a restricted moderation dashboard.
- Admins must be able to view pending reports.
- Admins must be able to resolve or dismiss reports.
- Admins must be able to see basic platform overview metrics.
- Non-admin users must be denied access to the moderation dashboard.

#### User Flow

1. Admin opens the admin page.
2. System verifies admin privileges.
3. Admin reviews stats and pending reports.
4. Admin resolves or dismisses reported items.

## Cross-Functional Requirements

### Access Control

- Authenticated users must only modify their own profile, likes, saves, follows, and comments unless explicitly allowed by admin permissions.
- Admin-only actions must be restricted at both UI and backend policy levels.

### Privacy

- User-facing content should avoid exposing sensitive personal identity data.
- Saved posts and personal notifications must remain private to the owning user.

### Safety

- The system must support reporting and moderation review.
- Harmful content detection may assist users or moderators but should not replace moderation controls.

### Reliability

- Counters for likes, comments, saves, and user stats must remain consistent with source actions.
- Notifications should be generated automatically for supported engagement events.

### Performance

- Feed and search results should load in a reasonable time for normal MVP-scale usage.
- Common list views should support pagination or sensible query limits as the platform grows.

## Non-MVP Feature Requirements

### AI Recommendations

- System may recommend posts, moods, or users based on behavior and content patterns.
- Recommendations must not replace the baseline chronological/trending feed.

### Real-Time Chat

- Users may exchange direct or group messages in real time.
- Chat must include permissions, delivery state, and moderation controls.

### Communities

- Users may join or create topic-based communities.
- Posts may later be scoped to a community as well as the global feed.

### Premium Subscriptions

- The platform may later offer paid tiers for advanced features.
- Premium features must not break the core free anonymous posting experience.

## Success Criteria for MVP

- A new user can register, sign in, create a post, receive engagement, and manage their profile.
- Users can browse and engage with posts through feed, detail, likes, comments, and saves.
- Harmful content can be reported and reviewed by admins.
- Notifications and counters update consistently enough for normal usage.
- The app supports a usable end-to-end anonymous social experience without requiring non-MVP features.

## Out of Scope for MVP

- Real-time messaging
- Community/group spaces
- Subscription billing
- Advanced recommendation engine
- Full creator monetization
- Rich media-first social features
