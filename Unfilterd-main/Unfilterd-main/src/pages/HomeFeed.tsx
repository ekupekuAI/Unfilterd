<<<<<<< HEAD
import { useState, useEffect, useCallback, useRef } from 'react';
=======
import { useState, useEffect, useCallback } from 'react';
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { PostCard } from '../components/PostCard';
import { PostCardSkeleton } from '../components/Skeleton';
<<<<<<< HEAD
import { PageContainer, EmptyState } from '../components/Layout';
import { Flame, Clock, Users, Filter, RefreshCw } from 'lucide-react';

type FeedFilter = 'latest' | 'trending' | 'weekly' | 'following';
const MOODS = Object.keys(MOOD_CONFIG) as Mood[];
const PAGE_SIZE = 12;

function scorePost(post: Post) {
  const ageHours = Math.max((Date.now() - new Date(post.created_at).getTime()) / 36e5, 1);
  const engagement = (post.like_count * 2) + (post.comment_count * 3) + (post.saves_count * 4);
  return engagement / Math.pow(ageHours, 0.65);
}
=======
import { PageContainer, EmptyState, LoadingSpinner } from '../components/Layout';
import { Flame, Clock, Users, Filter } from 'lucide-react';

type FeedFilter = 'latest' | 'trending' | 'following';
const MOODS = Object.keys(MOOD_CONFIG) as Mood[];
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

export function HomeFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>('latest');
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);
  const [showMoodFilter, setShowMoodFilter] = useState(false);
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
=======
  const [filter, setFilter] = useState<FeedFilter>('latest');
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);
  const [showMoodFilter, setShowMoodFilter] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_seed)')
      .order('created_at', { ascending: false })
      .limit(50);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

    if (moodFilter) {
      query = query.eq('mood', moodFilter);
    }

<<<<<<< HEAD
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (filter === 'weekly') {
      query = query.gte('created_at', weekAgo.toISOString());
=======
    if (filter === 'trending') {
      query = query.order('like_count', { ascending: false });
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
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
<<<<<<< HEAD
        setLoadingMore(false);
        setHasMore(false);
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
        return;
      }
    }

    const { data } = await query;
    let postList = (data ?? []) as Post[];

    if (user && postList.length > 0) {
      const postIds = postList.map(p => p.id);
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

      postList = postList.map(p => ({
        ...p,
        is_liked: likedIds.has(p.id),
        is_saved: savedIds.has(p.id),
      }));
    }

<<<<<<< HEAD
    if (filter === 'trending' || filter === 'weekly') {
      postList = postList.sort((a, b) => scorePost(b) - scorePost(a));
    }

    setPosts(prev => append ? [...prev, ...postList] : postList);
    setHasMore(postList.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [filter, moodFilter, user]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts, filter, moodFilter]);

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
=======
    setPosts(postList);
    setLoading(false);
  }, [filter, moodFilter, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

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
<<<<<<< HEAD
    { key: 'weekly', label: 'This Week', icon: Flame },
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    { key: 'following', label: 'Following', icon: Users },
  ];

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          UNFILTERD
        </h1>
<<<<<<< HEAD
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
=======
        <button
          onClick={() => setShowMoodFilter(!showMoodFilter)}
          className={`p-2 rounded-lg transition-colors ${showMoodFilter ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
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
            title={filter === 'following' ? 'No posts from followed users' : 'No posts yet'}
            description={filter === 'following' ? 'Follow some users to see their posts here' : 'Be the first to share something!'}
          />
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={handleLikeToggle}
              onSaveToggle={handleSaveToggle}
            />
          ))
        )}
<<<<<<< HEAD
        <div ref={sentinelRef} />
        {loadingMore && <PostCardSkeleton />}
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      </div>
    </PageContainer>
  );
}
