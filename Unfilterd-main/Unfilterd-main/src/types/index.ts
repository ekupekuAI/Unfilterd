export type Mood = 'happy' | 'sad' | 'angry' | 'lonely' | 'relationship' | 'career' | 'motivation' | 'confession' | 'random';

export type ReportReason = 'spam' | 'harassment' | 'abuse' | 'hate_speech' | 'inappropriate' | 'other';

export type NotificationType = 'like' | 'comment' | 'reply' | 'system';
<<<<<<< HEAD
export type MediaType = 'image' | 'gif' | 'video' | 'voice';
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_seed: string;
<<<<<<< HEAD
  avatar_url?: string;
  banner_url?: string;
  bio: string;
  is_admin: boolean;
  is_suspended: boolean;
  suspension_reason: string;
  posts_count: number;
  likes_received_count: number;
  followers_count?: number;
  following_count?: number;
  email_notifications?: boolean;
  follow_notifications?: boolean;
  comment_notifications?: boolean;
  reply_notifications?: boolean;
  mention_notifications?: boolean;
  privacy_private_profile?: boolean;
  privacy_allow_following?: boolean;
=======
  bio: string;
  is_admin: boolean;
  posts_count: number;
  likes_received_count: number;
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  mood: Mood;
  title: string;
  content: string;
  like_count: number;
  comment_count: number;
  saves_count: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string | null;
  profiles?: Profile;
<<<<<<< HEAD
  post_media?: PostMedia[];
  media?: PostMedia[];
  is_liked?: boolean;
  is_saved?: boolean;
  is_draft?: boolean;
}

export interface PostMedia {
  id: string;
  post_id: string;
  user_id: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;
  sort_order: number;
  created_at: string;
=======
  is_liked?: boolean;
  is_saved?: boolean;
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
  profiles?: Profile;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
<<<<<<< HEAD
  reported_user_id?: string | null;
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  admin_response: string;
  created_at: string;
  updated_at: string;
}

<<<<<<< HEAD
export interface UserSettings {
  email_notifications: boolean;
  follow_notifications: boolean;
  comment_notifications: boolean;
  reply_notifications: boolean;
  allow_following: boolean;
  private_profile: boolean;
}

=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  profiles?: Profile;
  actor_profile?: Profile;
}

<<<<<<< HEAD
export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  banner_url: string;
  avatar_url: string;
  creator_id: string;
  member_count: number;
  rules: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  is_member?: boolean;
}

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'owner';
  created_at: string;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  post_id: string;
  pinned: boolean;
  approved: boolean;
  created_at: string;
}

=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
export const MOOD_CONFIG: Record<Mood, { label: string; color: string; bg: string }> = {
  happy: { label: 'Happy', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  sad: { label: 'Sad', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  angry: { label: 'Angry', color: 'text-red-400', bg: 'bg-red-500/20' },
  lonely: { label: 'Lonely', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  relationship: { label: 'Relationship', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  career: { label: 'Career', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  motivation: { label: 'Motivation', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  confession: { label: 'Confession', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  random: { label: 'Random', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};
