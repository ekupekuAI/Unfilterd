import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
<<<<<<< HEAD
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import type { Post, Comment } from '../types';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { PageContainer, EmptyState, LoadingSpinner } from '../components/Layout';
import { PenLine, Bookmark, Heart, Settings, LogOut, Calendar, Hash, Trash2, CornerDownRight } from 'lucide-react';
import { STARTUP_ANIMATION_KEY, STARTUP_SOUND_KEY, type StartupAnimationMode } from '../settings/startupAnimation';

type ProfileTab = 'posts' | 'saved' | 'liked' | 'replies' | 'settings';
type JoinedPostRow = { posts: Post | Post[] | null };

function extractJoinedPost(row: JoinedPostRow) {
  if (!row.posts) return null;
  return Array.isArray(row.posts) ? row.posts[0] ?? null : row.posts;
}

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
=======
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { MoodBadge } from '../components/MoodBadge';
import { PageContainer, PageHeader, EmptyState, LoadingSpinner } from '../components/Layout';
import { PenLine, Bookmark, Heart, Settings, LogOut, Calendar, Hash } from 'lucide-react';

type ProfileTab = 'posts' | 'saved' | 'liked' | 'settings';

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  const [editUsername, setEditUsername] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState(profile?.bio ?? '');
<<<<<<< HEAD
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    follow_notifications: true,
    comment_notifications: true,
    reply_notifications: true,
  });
  const [startupMode, setStartupMode] = useState<StartupAnimationMode>('short');
  const [startupSound, setStartupSound] = useState(false);
  const effectiveProfile = profile ?? {
    id: user?.id ?? '',
    username: user?.email?.split('@')[0] ?? 'anonymous',
    display_name: 'Anonymous Soul',
    avatar_seed: user?.id ?? 'default',
    bio: '',
    is_admin: false,
    is_suspended: false,
    suspension_reason: '',
    posts_count: 0,
    likes_received_count: 0,
    created_at: user?.created_at ?? new Date().toISOString(),
    updated_at: user?.created_at ?? new Date().toISOString(),
  };
=======

  useEffect(() => {
    refreshProfile();
  }, []);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio);
    }
  }, [profile]);

<<<<<<< HEAD
  useEffect(() => {
    const key = `unfilterd:profile-settings:${user?.id ?? 'guest'}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      setNotificationSettings(prev => ({ ...prev, ...saved }));
    } catch {
      setNotificationSettings(prev => prev);
    }
    const startup = localStorage.getItem(STARTUP_ANIMATION_KEY);
    if (startup === 'full' || startup === 'short' || startup === 'disabled') setStartupMode(startup);
    setStartupSound(localStorage.getItem(STARTUP_SOUND_KEY) === 'on');
  }, [user?.id]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setContentLoading(true);
=======
  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    let data: Post[] = [];

    if (tab === 'posts') {
      const res = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_seed)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      data = (res.data ?? []) as Post[];
    } else if (tab === 'saved') {
      const res = await supabase
        .from('saved_posts')
        .select('post_id, posts(*, profiles(username, avatar_seed))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
<<<<<<< HEAD
      data = ((res.data ?? []) as JoinedPostRow[])
        .flatMap(row => {
          const post = extractJoinedPost(row);
          return post ? [{ ...post, is_saved: true }] : [];
        });
=======
      data = (res.data ?? []).map((s: any) => ({ ...s.posts, is_saved: true })) as Post[];
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    } else if (tab === 'liked') {
      const res = await supabase
        .from('likes')
        .select('post_id, posts(*, profiles(username, avatar_seed))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
<<<<<<< HEAD
      data = ((res.data ?? []) as JoinedPostRow[])
        .flatMap(row => {
          const post = extractJoinedPost(row);
          return post ? [{ ...post, is_liked: true }] : [];
        });
    } else if (tab === 'replies') {
      const res = await supabase
        .from('comments')
        .select('*, posts(*, profiles(username, avatar_seed))')
        .eq('user_id', user.id)
        .not('parent_comment_id', 'is', null)
        .order('created_at', { ascending: false });
      data = ((res.data ?? []) as Array<Comment & { posts?: Post }>)
        .flatMap(row => row.posts ? [row.posts] : []);
=======
      data = (res.data ?? []).map((l: any) => ({ ...l.posts, is_liked: true })) as Post[];
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    }

    if (user && data.length > 0 && tab === 'posts') {
      const postIds = data.map(p => p.id);
<<<<<<< HEAD
      const [likesRes, savesRes] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds),
        supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds),
      ]);
      const likedIds = new Set((likesRes.data ?? []).map(l => l.post_id));
      const savedIds = new Set((savesRes.data ?? []).map(s => s.post_id));
=======
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      const { data: saves } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      const likedIds = new Set((likes ?? []).map(l => l.post_id));
      const savedIds = new Set((saves ?? []).map(s => s.post_id));
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      data = data.map(p => ({
        ...p,
        is_liked: likedIds.has(p.id),
        is_saved: savedIds.has(p.id),
      }));
    }

    setPosts(data);
<<<<<<< HEAD
    setContentLoading(false);
=======
    setLoading(false);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  }, [tab, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleUpdateUsername = async () => {
    if (!username.trim() || username === profile?.username) {
      setEditUsername(false);
      return;
    }
    await supabase.from('profiles').update({ username: username.trim() }).eq('id', user!.id);
    await refreshProfile();
    setEditUsername(false);
  };

  const handleUpdateBio = async () => {
    await supabase.from('profiles').update({ bio }).eq('id', user!.id);
    await refreshProfile();
    setEditBio(false);
  };

<<<<<<< HEAD
  const handleChangePassword = async () => {
    if (newPassword.length < 8) return;
    await supabase.auth.updateUser({ password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
  };

  const saveNotificationSettings = () => {
    localStorage.setItem(`unfilterd:profile-settings:${user?.id ?? 'guest'}`, JSON.stringify(notificationSettings));
  };

  const saveAppearanceSettings = () => {
    localStorage.setItem(STARTUP_ANIMATION_KEY, startupMode);
    localStorage.setItem(STARTUP_SOUND_KEY, startupSound ? 'on' : 'off');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    await supabase.from('saved_posts').delete().eq('user_id', user.id);
    await supabase.from('likes').delete().eq('user_id', user.id);
    await supabase.from('comment_likes').delete().eq('user_id', user.id);
    await supabase.from('follows').delete().or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
    await supabase.from('comments').delete().eq('user_id', user.id);
    await supabase.from('posts').delete().eq('user_id', user.id);
    await supabase.from('reports').delete().eq('reporter_id', user.id);
    await supabase.from('notifications').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    await signOut();
  };

  if (!user) return <PageContainer><LoadingSpinner /></PageContainer>;
=======
  if (!user || !profile) return <PageContainer><LoadingSpinner /></PageContainer>;
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  const tabs: { key: ProfileTab; label: string; icon: React.ElementType }[] = [
    { key: 'posts', label: 'Posts', icon: PenLine },
    { key: 'saved', label: 'Saved', icon: Bookmark },
    { key: 'liked', label: 'Liked', icon: Heart },
<<<<<<< HEAD
    { key: 'replies', label: 'Replies', icon: CornerDownRight },
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <PageContainer>
      <div className="flex items-start gap-4 mb-6">
<<<<<<< HEAD
        <Avatar seed={effectiveProfile.avatar_seed} size="xl" />
=======
        <Avatar seed={profile.avatar_seed} size="xl" />
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
        <div className="flex-1 min-w-0">
          {editUsername ? (
            <div className="flex items-center gap-2">
              <input
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                className="bg-surface-50 rounded-lg px-3 py-1.5 text-white text-sm border border-white/5 focus:border-primary focus:outline-none"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleUpdateUsername()}
              />
              <button onClick={handleUpdateUsername} className="text-xs text-primary hover:text-primary-50">Save</button>
            </div>
          ) : (
            <button
              onClick={() => setEditUsername(true)}
              className="text-lg font-semibold text-white hover:text-primary-50 transition-colors"
            >
<<<<<<< HEAD
              {effectiveProfile.username}
            </button>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{effectiveProfile.posts_count} posts</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{effectiveProfile.likes_received_count} likes</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(effectiveProfile.created_at).toLocaleDateString()}</span>
=======
              {profile.username}
            </button>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{profile.posts_count} posts</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{profile.likes_received_count} likes</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(profile.created_at).toLocaleDateString()}</span>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
          </div>
        </div>
      </div>

      {editBio ? (
        <div className="mb-6">
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={160}
            rows={2}
            className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
<<<<<<< HEAD
            <button onClick={() => { setEditBio(false); setBio(effectiveProfile.bio); }} className="text-xs text-gray-500">Cancel</button>
=======
            <button onClick={() => { setEditBio(false); setBio(profile.bio); }} className="text-xs text-gray-500">Cancel</button>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
            <button onClick={handleUpdateBio} className="text-xs text-primary hover:text-primary-50">Save</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditBio(true)}
          className="block mb-6 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
<<<<<<< HEAD
          {effectiveProfile.bio || 'Add a bio...'}
=======
          {profile.bio || 'Add a bio...'}
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
        </button>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              tab === t.key ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Account</h3>
            <p className="text-sm text-gray-400 mb-1">Email: {user.email}</p>
<<<<<<< HEAD
            <p className="text-sm text-gray-400">Joined: {new Date(effectiveProfile.created_at).toLocaleDateString()}</p>
          </div>
          <div className="bg-surface rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-white">Security</h3>
            <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" placeholder="Current password" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white text-sm border border-white/5" />
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="New password" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white text-sm border border-white/5" />
            <button onClick={handleChangePassword} className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Change password</button>
          </div>
          <div className="bg-surface rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-white">Notifications & Privacy</h3>
            {Object.entries(notificationSettings).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm text-gray-300">
                <span className="capitalize">{key.split('_').join(' ')}</span>
                <input type="checkbox" checked={value} onChange={e => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))} />
              </label>
            ))}
            <button onClick={saveNotificationSettings} className="px-4 py-2 rounded-lg bg-surface-50 text-white text-sm">Save settings</button>
          </div>
          <div className="bg-surface rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-white">Appearance</h3>
            <div className="flex items-center justify-between gap-3 text-sm text-gray-300">
              <span>Theme</span>
              <select value={theme} onChange={e => setTheme(e.target.value as 'dark' | 'light')} className="bg-surface-50 rounded-lg px-3 py-2 text-white text-xs border border-white/5">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-gray-300">
              <span>Startup animation</span>
              <select value={startupMode} onChange={e => setStartupMode(e.target.value as StartupAnimationMode)} className="bg-surface-50 rounded-lg px-3 py-2 text-white text-xs border border-white/5">
                <option value="full">Full Cinematic</option>
                <option value="short">Short Intro</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm text-gray-300">
              <span>Startup sound</span>
              <input type="checkbox" checked={startupSound} onChange={e => setStartupSound(e.target.checked)} />
            </label>
            <button onClick={saveAppearanceSettings} className="px-4 py-2 rounded-lg bg-surface-50 text-white text-sm">Save appearance</button>
          </div>
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete account</h3>
            <p className="text-xs text-gray-400 mb-3">This removes your posts, likes, comments, saves, reports, and profile from the app.</p>
            <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg bg-danger text-white text-sm">Delete account</button>
=======
            <p className="text-sm text-gray-400">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-surface hover:bg-surface-50 rounded-xl text-danger font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
<<<<<<< HEAD
      ) : contentLoading ? (
=======
      ) : loading ? (
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={tab === 'saved' ? Bookmark : tab === 'liked' ? Heart : PenLine}
          title={`No ${tab} ${tab === 'posts' ? 'yet' : 'items'}`}
          description={tab === 'posts' ? 'Share your first anonymous thought' : `Posts you ${tab} will appear here`}
        />
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} onSaveToggle={() => fetchPosts()} />)}
        </div>
      )}
    </PageContainer>
  );
}
