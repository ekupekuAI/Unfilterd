import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Profile, ReportReason } from '../types';
import { PageContainer, EmptyState, LoadingSpinner } from '../components/Layout';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { Modal } from '../components/Modal';
import { ArrowLeft, Ban, Flag, Heart, Link as LinkIcon, UserMinus, UserPlus, Volume2, VolumeX } from 'lucide-react';

type TabKey = 'posts' | 'liked' | 'saved';

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<TabKey>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('other');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const [profileRes, followRes, blockRes, muteRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', id).maybeSingle() : Promise.resolve({ data: null }),
        user ? supabase.from('blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', id).maybeSingle() : Promise.resolve({ data: null }),
        user ? supabase.from('mutes').select('id').eq('muter_id', user.id).eq('muted_id', id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setProfile((profileRes.data ?? null) as Profile | null);
      setFollowing(!!followRes.data);
      setBlocked(!!blockRes.data);
      setMuted(!!muteRes.data);
      setLoading(false);
    };
    load();
  }, [id, user, tab]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!id) return;
      if (tab === 'posts') {
        const { data } = await supabase.from('posts').select('*, profiles(username, avatar_seed), post_media(*)').eq('user_id', id).order('created_at', { ascending: false });
        setPosts((data ?? []) as Post[]);
      } else if (tab === 'liked' && user) {
        const { data } = await supabase.from('likes').select('post_id, posts(*, profiles(username, avatar_seed), post_media(*))').eq('user_id', id).order('created_at', { ascending: false });
        setPosts(((data ?? []) as Array<{ posts: Post | Post[] | null }>).flatMap(row => Array.isArray(row.posts) ? row.posts.slice(0, 1) : row.posts ? [row.posts] : []));
      } else if (tab === 'saved' && user) {
        const { data } = await supabase.from('saved_posts').select('post_id, posts(*, profiles(username, avatar_seed), post_media(*))').eq('user_id', id).order('created_at', { ascending: false });
        setPosts(((data ?? []) as Array<{ posts: Post | Post[] | null }>).flatMap(row => Array.isArray(row.posts) ? row.posts.slice(0, 1) : row.posts ? [row.posts] : []));
      }
    };
    loadPosts();
  }, [id, tab, user]);

  const toggleFollow = async () => {
    if (!user || !id) return;
    const next = !following;
    setFollowing(next);
    const { error } = following
      ? await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id)
      : await supabase.from('follows').insert({ follower_id: user.id, following_id: id });
    if (error) setFollowing(following);
  };

  const toggleBlock = async () => {
    if (!user || !id) return;
    const next = !blocked;
    setBlocked(next);
    const { error } = blocked
      ? await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', id)
      : await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: id });
    if (error) setBlocked(blocked);
  };

  const toggleMute = async () => {
    if (!user || !id) return;
    const next = !muted;
    setMuted(next);
    const { error } = muted
      ? await supabase.from('mutes').delete().eq('muter_id', user.id).eq('muted_id', id)
      : await supabase.from('mutes').insert({ muter_id: user.id, muted_id: id });
    if (error) setMuted(muted);
  };

  const reportUser = async () => {
    if (!user || !id) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: id,
      reason: reportReason,
      description: reportDescription,
    });
    setReportOpen(false);
  };

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;
  if (!profile) return <PageContainer><EmptyState icon={Flag} title="Profile not found" description="This user may have been removed." /></PageContainer>;

  const isOwn = user?.id === profile.id;

  return (
    <PageContainer>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-surface rounded-2xl overflow-hidden mb-5">
        <div className="h-28 bg-gradient-to-r from-primary/30 via-secondary/20 to-warning/20" />
        <div className="p-5 -mt-10">
          <div className="flex items-end gap-4">
            <Avatar seed={profile.avatar_seed} size="xl" className="ring-4 ring-[#0F172A]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                {blocked && <span className="text-xs text-danger">Blocked</span>}
              </div>
              <p className="text-sm text-gray-400 mt-1">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-5 text-center text-sm">
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-white font-semibold">{profile.posts_count}</p>
              <p className="text-gray-500">Posts</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-white font-semibold">{profile.followers_count ?? 0}</p>
              <p className="text-gray-500">Followers</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-white font-semibold">{profile.following_count ?? 0}</p>
              <p className="text-gray-500">Following</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-white font-semibold">{profile.likes_received_count}</p>
              <p className="text-gray-500">Likes</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
          {!isOwn && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={toggleFollow} className="px-4 py-2 rounded-lg bg-primary text-white text-sm flex items-center gap-2">
                {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {following ? 'Unfollow' : 'Follow'}
              </button>
              <button onClick={toggleBlock} className="px-4 py-2 rounded-lg bg-surface-50 text-white text-sm flex items-center gap-2">
                <Ban className="w-4 h-4" />
                {blocked ? 'Unblock' : 'Block'}
              </button>
              <button onClick={toggleMute} className="px-4 py-2 rounded-lg bg-surface-50 text-white text-sm flex items-center gap-2">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => setReportOpen(true)} className="px-4 py-2 rounded-lg bg-danger/20 text-danger text-sm flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Report
              </button>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="px-4 py-2 rounded-lg bg-surface-50 text-white text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Copy link
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['posts', 'liked', 'saved'] as const).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400'}`}
          >
            {key}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={Heart} title="No content yet" description="This user has no posts in this section." />
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report user" size="sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            {(['spam', 'harassment', 'abuse', 'hate_speech', 'inappropriate', 'other'] as ReportReason[]).map(reason => (
              <label key={reason} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                <input type="radio" checked={reportReason === reason} onChange={() => setReportReason(reason)} className="accent-primary" />
                <span className="text-sm text-gray-300 capitalize">{reason.split('_').join(' ')}</span>
              </label>
            ))}
          </div>
          <textarea
            value={reportDescription}
            onChange={e => setReportDescription(e.target.value)}
            placeholder="Additional details"
            className="w-full bg-surface-50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none resize-none h-20"
          />
          <button onClick={reportUser} className="w-full py-2.5 bg-danger rounded-lg text-white text-sm font-medium">Submit report</button>
        </div>
      </Modal>
    </PageContainer>
  );
}
