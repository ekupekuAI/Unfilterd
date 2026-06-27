# PROJECT_CONTEXT

## Purpose of UNFILTERD

UNFILTERD is an anonymous, mood-driven social platform for text-based self-expression.
Users can register, publish posts, react to other posts, follow people, receive notifications, and report abusive content.
The product leans toward lightweight community interaction with moderation and anonymity rather than public identity-first social networking.

## Features

### Current user features

- Email/password sign up and sign in via Supabase Auth
- Protected app routes for authenticated users
- Anonymous-style profile with generated avatar seed
- Create text posts with:
  - title
  - content
  - mood selection
- Home feed with:
  - latest posts
  - trending posts
  - following-only posts
- Mood-based filtering in the feed
- Post detail page with comments and nested replies
- Like posts
- Save posts
- Share post links
- Search:
  - posts
  - users
  - moods
- Follow/unfollow users
- Profile page with:
  - own posts
  - saved posts
  - liked posts
  - editable username
  - editable bio
- Notifications page with read/unread state
- Report posts for moderation
- Admin page for report review and simple platform stats

### Current moderation and automation features

- Auto-create `profiles` row when a new auth user is created
- Auto-update counters for:
  - post likes
  - post comments
  - saved posts
  - profile post count
  - profile likes received count
  - comment likes
- Auto-create notifications when:
  - a post is liked
  - a post is commented on
  - a reply is added

### Current AI-related features

- Local keyword-based toxicity warning during post creation
- Local keyword-based mood suggestion during post creation
- Separate Supabase Edge Function for moderation analysis
  - detects mood
  - detects toxicity severity
  - currently not wired into the frontend

## Architecture

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React icons

### Backend

- Supabase Auth for authentication
- Supabase Postgres for application data
- Supabase Row Level Security policies for access control
- Supabase database triggers/functions for counters, profile creation, and notifications
- Supabase Edge Function for moderation analysis

### Application structure

- `src/App.tsx`
  - top-level router
  - protected route wrapper
- `src/hooks/useAuth.tsx`
  - auth context
  - session restoration
  - profile loading
- `src/lib/supabase.ts`
  - Supabase client initialization from Vite env vars
- `src/pages`
  - route-level screens
- `src/components`
  - reusable UI building blocks
- `src/types`
  - shared domain types and mood config
- `supabase/migrations`
  - schema updates, policies, triggers
- `supabase/functions`
  - edge functions

## Database Schema

This repository contains additive migrations and inferred schema usage.
It does not contain a complete first-principles schema bootstrap for a brand new database.

### Core tables used by the app

#### `profiles`

Used as the user profile table linked to Supabase Auth users.

Known fields:

- `id`
- `username`
- `display_name`
- `avatar_seed`
- `bio`
- `is_admin`
- `posts_count`
- `likes_received_count`
- `created_at`
- `updated_at`

Behavior:

- auto-created on auth signup by trigger
- readable by authenticated users
- user can update own profile
- admin status gates access to admin page

#### `posts`

Main content table.

Known fields:

- `id`
- `user_id`
- `mood`
- `title`
- `content`
- `like_count`
- `comment_count`
- `saves_count`
- `is_flagged`
- `created_at`
- `updated_at`

Behavior:

- authenticated users can read posts
- users can insert/update/delete their own posts
- counters are maintained by triggers

#### `comments`

Stores comments and replies.

Known fields:

- `id`
- `post_id`
- `user_id`
- `parent_comment_id`
- `content`
- `like_count`
- `created_at`

Behavior:

- nested replies are modeled through `parent_comment_id`
- authenticated users can read comments
- users can insert/update/delete their own comments
- comment count is maintained on parent posts

#### `likes`

Stores post likes.

Known fields:

- `id`
- `user_id`
- `post_id`
- `created_at`

Behavior:

- authenticated users can read likes
- users can create/delete their own likes
- triggers update `posts.like_count`
- triggers update `profiles.likes_received_count`
- triggers create notifications

#### `comment_likes`

Stores likes on comments.

Known fields:

- `id`
- `user_id`
- `comment_id`
- `created_at`

Behavior:

- authenticated users can read/create/delete their own comment likes
- trigger updates `comments.like_count`

#### `saved_posts`

Stores saved/bookmarked posts per user.

Known fields:

- `id`
- `user_id`
- `post_id`
- `created_at`

Behavior:

- only the owner can read their saved posts
- only the owner can create/delete their saved posts
- trigger updates `posts.saves_count`

#### `follows`

Stores user follow relationships.

Known fields:

- `id`
- `follower_id`
- `following_id`
- `created_at`

Behavior:

- authenticated users can read follow data
- user can create/delete only their own follow relationships

#### `reports`

Stores moderation reports.

Known fields:

- `id`
- `reporter_id`
- `post_id`
- `comment_id`
- `reason`
- `description`
- `status`
- `admin_response`
- `created_at`
- `updated_at`

Known statuses:

- `pending`
- `reviewed`
- `resolved`
- `dismissed`

Behavior:

- reporter can view own reports
- admins can view and update all reports

#### `notifications`

Stores app notifications.

Known fields:

- `id`
- `user_id`
- `type`
- `actor_id`
- `post_id`
- `comment_id`
- `message`
- `read`
- `created_at`

Known types:

- `like`
- `comment`
- `reply`
- `system`

Behavior:

- users can only read/update/delete their own notifications
- insert policy currently requires `auth.uid() = user_id`
- notification rows are also created by database trigger functions

## Authentication System

Authentication is implemented with Supabase Auth and a React context wrapper.

### Flow

1. App starts.
2. `useAuth` calls `supabase.auth.getSession()`.
3. If a session exists, the app fetches the matching `profiles` row.
4. Auth state changes are tracked with `supabase.auth.onAuthStateChange(...)`.
5. Protected routes redirect unauthenticated users to `/login`.
6. Sign up uses `supabase.auth.signUp(...)`.
7. Sign in uses `supabase.auth.signInWithPassword(...)`.
8. Sign out uses `supabase.auth.signOut()`.

### Important notes

- The app depends on a `profiles` record existing for each auth user.
- A database trigger is intended to create that record automatically.
- The frontend assumes authenticated users have profile data available soon after login/signup.

## Existing Pages

### `LoginPage`

- email/password sign in
- inline error display
- password visibility toggle

### `RegisterPage`

- username, email, password, confirm password
- basic password strength display
- client-side validation

### `HomeFeedPage`

- latest/trending/following filters
- mood filter
- feed rendering with post cards

### `CreatePostPage`

- compose new text post
- choose mood
- local mood suggestion
- local toxicity warning

### `PostDetailPage`

- single post view
- comment list
- nested replies
- add/delete own comments

### `ProfilePage`

- show profile summary
- edit username
- edit bio
- tabs for posts, saved, liked, settings
- sign out action

### `SearchPage`

- search posts
- search users
- mood browsing
- follow/unfollow from search results

### `NotificationsPage`

- show recent notifications
- mark one as read
- mark all as read

### `AdminPage`

- restricted to users with `profile.is_admin = true`
- overview stats
- pending reports list
- resolve/dismiss reports

## Existing Components

### Layout and shell

- `PageContainer`
- `PageHeader`
- `EmptyState`
- `LoadingSpinner`
- `TopNav`
- `BottomNav`

### Content and UI

- `PostCard`
- `MoodBadge`
- `Avatar`
- `AnonymousAvatar`
- `Modal`
- `ReportModal`
- `Skeleton`
- `PostCardSkeleton`

## Future Roadmap

The current project is functional but still early-stage.
The roadmap below is intended as an incremental direction, not a rewrite plan.

### Near-term priorities

- Add a complete base schema for fresh Supabase setup
- Add `.env.example` and setup documentation
- Verify auth flow against email confirmation behavior
- Improve error handling for all Supabase writes
- Add missing feature parity already implied by schema:
  - comment reporting
  - comment likes UI
  - post delete/edit UI

### Product improvements

- User profile viewing for other users
- Better admin moderation tools
- Richer notification detail
- Real-time subscriptions for feed/comments/notifications
- Better search relevance and filters
- Saved/follow counts in profile

### Moderation and AI improvements

- Connect frontend to the existing `ai-moderation` edge function
- Consolidate moderation logic so frontend and backend do not drift
- Add moderation enforcement instead of warning-only behavior
- Add audit trail or moderation history for admin actions

### Engineering improvements

- Add test coverage for:
  - auth flow
  - route protection
  - core feed behavior
  - key database policies/triggers
- Add deployment documentation
- Add CI for lint, typecheck, and build
- Add stronger observability and runtime error reporting
