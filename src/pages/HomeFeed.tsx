import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { PostCard } from '../components/PostCard';
import { motion } from 'framer-motion';
import { PostCardSkeleton } from '../components/Skeleton';
import { PageContainer, EmptyState } from '../components/Layout';
import { Flame, Clock, Users, Filter, RefreshCw, Sparkles, X } from 'lucide-react';
import { VIBE_TAGS, VIBE_TAG_LABELS, isVibeTag, type VibeTag } from '../lib/vibe';

type FeedFilter = 'latest' | 'trending' | 'weekly' | 'following';
const MOODS = Object.keys(MOOD_CONFIG) as Mood[];
const PAGE_SIZE = 12;
const VIBE_FILTER_KEY = 'unfilterd:vibe-filters';

function loadVibeFilters(): VibeTag[] {
  try {
    const saved = JSON.parse(localStorage.getItem(VIBE_FILTER_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((t): t is VibeTag => typeof t === 'string' && isVibeTag(t)) : [];
  } catch {
    return [];
  }
}

function scorePost(post: Post) {
  const ageHours = Math.max((Date.now() - new Date(post.created_at).getTime()) / 36e5, 1);
  const engagement = (post.like_count * 2) + (post.comment_count * 3) + (post.saves_count * 4);
  return engagement / Math.pow(ageHours, 0.65);
}

export function HomeFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>('latest');
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);
  const [showMoodFilter, setShowMoodFilter] = useState(false);
  const [vibeFilters, setVibeFilters] = useState<VibeTag[]>(loadVibeFilters);
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const fetchPosts = useCallback(async (nextPage = 0, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_seed), post_media(*)')
      .order('created_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);

    if (moodFilter) {
      query = query.eq('mood', moodFilter);
    }

    if (vibeFilters.length) {
      query = query.overlaps('vibe_tags', vibeFilters);
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (filter === 'weekly') {
      query = query.gte('created_at', weekAgo.toISOString());
    }

    if (filter === 'following' && user) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (follows && follows.length > 0) {
        query = query.in('user_id', follows.map(f => f.following_id));
      } else {
        setPosts([]);
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
        return;
      }
    }

    const { data } = await query;
    let postList = (data ?? []) as Post[];

    if (user && postList.length > 0) {
      const postIds = postList.map(p => p.id);
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

      postList = postList.map(p => ({
        ...p,
        is_liked: likedIds.has(p.id),
        is_saved: savedIds.has(p.id),
      }));
    }

    if (filter === 'trending' || filter === 'weekly') {
      postList = postList.sort((a, b) => scorePost(b) - scorePost(a));
    }

    setPosts(prev => append ? [...prev, ...postList] : postList);
    setHasMore(postList.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [filter, moodFilter, vibeFilters, user]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts, filter, moodFilter, vibeFilters]);

  useEffect(() => {
    try {
      localStorage.setItem(VIBE_FILTER_KEY, JSON.stringify(vibeFilters));
    } catch {
      // storage unavailable: filters just won't persist
    }
  }, [vibeFilters]);

  const toggleVibeFilter = (tag: VibeTag) => {
    setVibeFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
      }
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) setTouchStartY(e.touches[0]?.clientY ?? null);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const startY = touchStartY;
      const endY = e.changedTouches[0]?.clientY ?? null;
      if (startY !== null && endY !== null && endY - startY > 80 && window.scrollY <= 0) {
        refresh();
      }
      setTouchStartY(null);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [refresh, touchStartY]);

  const handleLikeToggle = (postId: string, liked: boolean) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_liked: liked, like_count: liked ? p.like_count + 1 : p.like_count - 1 } : p
    ));
  };

  const handleSaveToggle = (postId: string, saved: boolean) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_saved: saved } : p
    ));
  };

  const filters: { key: FeedFilter; label: string; icon: React.ElementType }[] = [
    { key: 'latest', label: 'Latest', icon: Clock },
    { key: 'trending', label: 'Trending', icon: Flame },
    { key: 'weekly', label: 'This Week', icon: Flame },
    { key: 'following', label: 'Following', icon: Users },
  ];

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl text-white">How's everyone feeling?</h1>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors" title="Refresh feed">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMoodFilter(!showMoodFilter)}
            className={`p-2 rounded-lg transition-colors ${showMoodFilter ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-surface-50 text-gray-400 hover:text-white hover:bg-surface-200/50'
            }`}
          >
            <f.icon className="w-4 h-4" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl bg-surface/60 border border-white/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {vibeFilters.length ? 'Showing posts about' : 'Show me posts about what I\'m going through'}
          </p>
          <button
            onClick={() => setShowVibePicker(v => !v)}
            className="text-xs text-primary-50 hover:text-white"
          >
            {showVibePicker ? 'Done' : vibeFilters.length ? 'Edit' : 'Choose'}
          </button>
        </div>
        {(vibeFilters.length > 0 || showVibePicker) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(showVibePicker ? [...VIBE_TAGS] : vibeFilters).map(tag => {
              const active = vibeFilters.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleVibeFilter(tag)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                    active ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400 hover:text-white'
                  }`}
                >
                  #{VIBE_TAG_LABELS[tag]}
                  {active && !showVibePicker && <X className="w-3 h-3" />}
                </button>
              );
            })}
            {vibeFilters.length > 0 && !showVibePicker && (
              <button onClick={() => setVibeFilters([])} className="px-2 py-1 text-xs text-gray-500 hover:text-white">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {showMoodFilter && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 animate-slide-down">
          <button
            onClick={() => setMoodFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              !moodFilter ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMoodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                moodFilter === m
                  ? `${MOOD_CONFIG[m].bg} ${MOOD_CONFIG[m].color}`
                  : 'bg-surface-50 text-gray-400 hover:text-white'
              }`}
            >
              {MOOD_CONFIG[m].label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Flame}
            title={filter === 'following' ? 'No posts from followed users' : vibeFilters.length ? 'Nobody has posted about this yet' : 'No posts yet'}
            description={filter === 'following' ? 'Follow some users to see their posts here' : vibeFilters.length ? 'You could be the first. Someone out there may be feeling it too.' : 'Be the first to share something!'}
          />
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % PAGE_SIZE) * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <PostCard
                post={post}
                onLikeToggle={handleLikeToggle}
                onSaveToggle={handleSaveToggle}
              />
            </motion.div>
          ))
        )}
        <div ref={sentinelRef} />
        {loadingMore && <PostCardSkeleton />}
      </div>
    </PageContainer>
  );
}
