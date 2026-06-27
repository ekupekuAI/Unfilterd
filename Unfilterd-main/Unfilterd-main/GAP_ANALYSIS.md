# GAP_ANALYSIS

## Scope of Comparison

This document compares:

1. The current implementation described in `PROJECT_CONTEXT.md`
2. The intended product behavior described in `PRODUCT_REQUIREMENTS.md`

The goal is to identify what is complete, what is incomplete, what is missing, what appears broken, and what blocks production readiness.

## Fully Implemented Features

### Authentication

- Email/password sign up exists
- Email/password sign in exists
- Session restoration exists through Supabase session loading
- Protected routes exist for authenticated-only pages
- Sign out exists

### Anonymous Posting

- Authenticated users can create posts
- Posts support title, content, and mood
- Posts display anonymous-style profile identity rather than public personal identity
- Basic harmful-language warning and mood suggestion exist during composition
- Successful post creation redirects to the post detail page

### Feed

- Authenticated users can browse a feed
- Feed supports:
  - latest
  - trending
  - following
- Feed supports mood filtering
- Post cards expose:
  - view
  - like
  - save
  - share
  - report

### Comments

- Users can add comments to posts
- Users can reply to comments
- Nested comment relationships are supported through `parent_comment_id`
- Users can delete their own comments

### Likes

- Users can like posts
- Users can unlike posts
- Like counts are intended to update through database triggers

### Saved Posts

- Users can save posts
- Users can unsave posts
- Saved posts are exposed in a profile tab
- Saved-post visibility is intended to be private through RLS

### Profile

- Users have a profile page
- Profile exposes basic activity metadata
- Users can edit username
- Users can edit bio
- Profile contains tabs for:
  - own posts
  - saved posts
  - liked posts
  - settings
- Users can sign out from profile/settings

### Notifications

- Users can view a notifications page
- Users can mark single notifications as read
- Users can mark all notifications as read
- Notification types for like, comment, and reply are modeled

### Admin Moderation

- Admin page exists
- Non-admin users are denied access in the UI
- Admins can view pending reports
- Admins can resolve reports
- Admins can dismiss reports
- Admins can view basic counts for users, posts, and pending reports

## Partially Implemented Features

### Authentication

- The requirement that every authenticated user has an associated profile record is only partially satisfied.
- It depends on a database trigger creating the profile row correctly.
- The frontend assumes profile availability immediately after auth, but there is no fallback recovery path if the trigger fails or is delayed.

### Reports

- Post reporting is implemented.
- Comment reporting is supported by the shared modal contract and database shape, but there is no visible comment-report entry point in the current UI.
- User-facing report history is not exposed, even though the data model supports reports.

### Notifications

- Notification viewing exists, but the full requirement is only partially satisfied because generation depends on trigger behavior and policy compatibility.
- `system` notification type is modeled but there is no visible system-notification creation flow in the app.
- Notification badges in nav are refreshed by query on load/navigation, not by real-time updates.

### Feed Reliability

- Feed modes exist, but “trending” is implemented as ordering by `like_count` after already applying `created_at` ordering in the query chain, which may not produce a clean or well-defined ranking depending on query behavior.
- Following feed exists, but only if follow data and corresponding RLS behavior are working correctly.

### Safety / Moderation

- Harmful-content detection exists only as a local warning.
- The project also includes an edge moderation function, but it is not connected to the app.
- Moderation support therefore exists, but enforcement is weak and fragmented.

### Search

- Search for posts, users, and moods exists.
- It is useful as an MVP convenience feature, but it is not listed as a core MVP requirement and is currently basic:
  - no pagination
  - no robust escaping strategy for free-text query composition
  - no richer filters or relevance tuning

## Missing Features

These are missing relative to the current requirements, roadmap expectations, or implied platform completeness.

### MVP-adjacent missing pieces

- No comment reporting UI
- No comment-like UI despite `comment_likes` support in the schema/types
- No post edit UI
- No post delete UI, even though delete policy exists
- No user-facing report history or moderation status view
- No recovery path when profile auto-creation fails

### Product completeness gaps

- No password reset flow
- No email verification handling UX
- No public/other-user profile page
- No richer admin review context for reported content
- No audit history for moderation actions
- No pagination or infinite loading for major list views
- No real-time updates for comments, notifications, or feed changes

### Non-MVP features not implemented

- No AI recommendations
- No real-time chat
- No communities
- No premium subscriptions

## Broken Features

These are areas where the current implementation appears likely to fail or behave incorrectly.

### Notifications may be blocked by policy design

- Notification rows are created by database triggers for other users.
- The documented notifications insert policy requires `auth.uid() = user_id`.
- That policy is incompatible with normal client-side insertion for someone else’s notification and may also interfere unless the trigger path bypasses RLS as intended.
- This makes notification generation a probable failure point unless the database execution context is validated carefully.

### Signup flow may break when email confirmation is enabled

- Registration navigates users directly into the authenticated area after `signUp`.
- If the Supabase project requires email confirmation before a valid session is established, the redirect can send the user into a flow that immediately bounces back or leaves the app in an inconsistent state.

### Optimistic engagement updates can desync from actual database state

- Likes and saves are updated in local UI state before the database operation is confirmed.
- There is no rollback or error handling if the write fails.
- This can produce incorrect counts or incorrect saved/liked state in the UI.

### Admin data fetch runs before access guard resolves

- The admin page fetches platform data before enforcing the admin-only UI branch.
- If backend policies are strict, non-admin users may hit avoidable errors or wasted requests before the screen resolves to access denied.

### Fresh-database setup is incomplete

- The repository does not contain a complete base schema for all required tables.
- A new Supabase project cannot be considered reliably functional from this repo alone without external schema state.
- That means the application can be “implemented” in code but still nonfunctional in a fresh environment.

## Production Readiness Issues

### Backend and schema readiness

- No full schema bootstrap for a clean project
- Heavy dependence on inferred pre-existing tables
- No validated migration path from empty database to working app
- Trigger and RLS interactions are not backed by tests

### Quality and reliability

- No automated tests
- No integration tests for auth, feeds, notifications, or moderation flows
- Minimal error handling on Supabase operations
- No retry or rollback logic for optimistic updates
- No explicit empty/error/recovery handling for several backend failure paths

### Deployment and operations

- No deployment guide
- No `.env.example`
- No CI pipeline for build, lint, or typecheck
- No observability or runtime error reporting
- No documented production environment checklist

### Security and access control validation

- RLS policies exist, but there is no evidence of policy validation or contract testing
- Admin access is enforced in UI and intended in DB, but this has not been verified end-to-end in the repo
- Notification trigger + policy compatibility is a specific risk

### Performance and scale

- List views rely on fixed limits rather than scalable pagination
- No real-time sync for user-facing dynamic data
- Search is basic and may degrade with larger data sets

## Summary

UNFILTERD already covers most of the visible MVP surface area in code: authentication, posting, feed, comments, likes, saves, profile, notifications, reports, and admin moderation all exist in some form.

The main gaps are not “missing screens” so much as incomplete backend contract hardening and incomplete feature depth.
The largest risks are:

- incomplete fresh-project database setup
- fragile auth/profile creation assumptions
- likely notification policy/trigger mismatch
- weak failure handling for writes
- lack of testing and deployment readiness
