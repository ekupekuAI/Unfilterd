import { useState, useCallback, useEffect } from 'react';
<<<<<<< HEAD
import { Link } from 'react-router-dom';
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Profile, Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { PageContainer, EmptyState, LoadingSpinner } from '../components/Layout';
import { Search as SearchIcon, Users, FileText } from 'lucide-react';

type SearchTab = 'posts' | 'users' | 'moods';

<<<<<<< HEAD
function mergePosts(rows: Post[]) {
  const map = new Map<string, Post>();
  rows.forEach(row => {
    const existing = map.get(row.id);
    map.set(row.id, existing ? { ...existing, ...row } : row);
  });
  return Array.from(map.values());
}

=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
export function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('posts');
  const [results, setResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
<<<<<<< HEAD
  const [error, setError] = useState('');

  const attachInteractionState = useCallback(async (postList: Post[]) => {
    if (!user || postList.length === 0) return postList;

    const postIds = postList.map(p => p.id);
    const [{ data: likes, error: likesError }, { data: saves, error: savesError }] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds),
    ]);

    if (likesError || savesError) return postList;

    const likedIds = new Set((likes ?? []).map(l => l.post_id));
    const savedIds = new Set((saves ?? []).map(s => s.post_id));
    return postList.map(p => ({ ...p, is_liked: likedIds.has(p.id), is_saved: savedIds.has(p.id) }));
  }, [user]);
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
<<<<<<< HEAD
    setError('');

    if (tab === 'posts') {
      const pattern = `%${query.trim()}%`;
      const [titleRes, contentRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profiles(username, avatar_seed), post_media(*)')
          .ilike('title', pattern)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('posts')
          .select('*, profiles(username, avatar_seed), post_media(*)')
          .ilike('content', pattern)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (titleRes.error || contentRes.error) {
        setResults([]);
        setError(titleRes.error?.message ?? contentRes.error?.message ?? 'Search failed.');
        setLoading(false);
        return;
      }

      let postList = mergePosts([...(titleRes.data ?? []), ...(contentRes.data ?? [])] as Post[]);
      postList = await attachInteractionState(postList);
      setResults(postList);
    } else if (tab === 'users') {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query.trim()}%`)
        .limit(20);
      if (queryError) {
        setUserResults([]);
        setError(queryError.message);
        setLoading(false);
        return;
      }
=======

    if (tab === 'posts') {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_seed)')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(30);
      let postList = (data ?? []) as Post[];
      if (user && postList.length > 0) {
        const postIds = postList.map(p => p.id);
        const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds);
        const { data: saves } = await supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds);
        const likedIds = new Set((likes ?? []).map(l => l.post_id));
        const savedIds = new Set((saves ?? []).map(s => s.post_id));
        postList = postList.map(p => ({ ...p, is_liked: likedIds.has(p.id), is_saved: savedIds.has(p.id) }));
      }
      setResults(postList);
    } else if (tab === 'users') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(20);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      setUserResults((data ?? []) as Profile[]);
    }

    setLoading(false);
<<<<<<< HEAD
  }, [attachInteractionState, query, tab]);
=======
  }, [query, tab, user]);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleMoodSearch = async (mood: Mood) => {
    setLoading(true);
    setSearched(true);
    setQuery(MOOD_CONFIG[mood].label);
<<<<<<< HEAD
    setError('');
    const { data, error: queryError } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_seed), post_media(*)')
      .eq('mood', mood)
      .order('created_at', { ascending: false })
      .limit(30);
    if (queryError) {
      setResults([]);
      setError(queryError.message);
      setLoading(false);
      return;
    }
    const postList = await attachInteractionState((data ?? []) as Post[]);
    setResults(postList);
=======
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_seed)')
      .eq('mood', mood)
      .order('created_at', { ascending: false })
      .limit(30);
    setResults((data ?? []) as Post[]);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    setLoading(false);
  };

  const tabs: { key: SearchTab; label: string; icon: React.ElementType }[] = [
    { key: 'posts', label: 'Posts', icon: FileText },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'moods', label: 'Moods', icon: SearchIcon },
  ];

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-white mb-4">Search</h1>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, users, moods..."
            className="w-full bg-surface-50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="px-5 py-3 bg-primary hover:bg-primary-200 disabled:opacity-40 rounded-xl text-white font-medium transition-colors"
        >
          Search
        </button>
      </div>

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

      {tab === 'moods' && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleMoodSearch(key)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${config.bg} ${config.color} hover:opacity-80`}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : !searched ? (
        <EmptyState
          icon={SearchIcon}
          title="Search UNFILTERD"
          description="Find posts, users, or browse by mood"
        />
      ) : tab === 'users' ? (
        userResults.length === 0 ? (
<<<<<<< HEAD
          <EmptyState icon={Users} title={error ? 'Search failed' : 'No users found'} description={error || 'Try a different search term'} />
=======
          <EmptyState icon={Users} title="No users found" description="Try a different search term" />
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
        ) : (
          <div className="space-y-2">
            {userResults.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-4 bg-surface rounded-xl hover:bg-surface-50/50 transition-colors">
<<<<<<< HEAD
                <Link to={`/profile/${p.id}`}>
                  <Avatar seed={p.avatar_seed} size="md" />
                </Link>
                <div>
                  <Link to={`/profile/${p.id}`} className="text-sm font-medium text-white hover:text-primary-50">{p.username}</Link>
=======
                <Avatar seed={p.avatar_seed} size="md" />
                <div>
                  <p className="text-sm font-medium text-white">{p.username}</p>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
                  <p className="text-xs text-gray-500">{p.posts_count} posts</p>
                </div>
                {user && p.id !== user.id && (
                  <FollowButton key={p.id} targetId={p.id} currentUserId={user.id} />
                )}
              </div>
            ))}
          </div>
        )
      ) : results.length === 0 ? (
<<<<<<< HEAD
        <EmptyState icon={FileText} title={error ? 'Search failed' : 'No posts found'} description={error || 'Try a different search term'} />
=======
        <EmptyState icon={FileText} title="No posts found" description="Try a different search term" />
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      ) : (
        <div className="space-y-4">
          {results.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </PageContainer>
  );
}

function FollowButton({ targetId, currentUserId }: { targetId: string; currentUserId: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [submitting, setSubmitting] = useState(false);
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  useEffect(() => {
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetId)
      .maybeSingle()
      .then(({ data }) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [currentUserId, targetId]);

  const toggle = async () => {
<<<<<<< HEAD
    if (submitting) return;

    const previous = following;
    const next = !previous;
    setSubmitting(true);
    setFollowing(next);

    const { error } = previous
      ? await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId)
      : await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId });

    if (error) {
      setFollowing(previous);
    }
    setSubmitting(false);
=======
    setFollowing(!following);
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId });
    }
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
<<<<<<< HEAD
      disabled={submitting}
      className={`ml-auto px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        following ? 'bg-surface-200 text-gray-300 hover:bg-danger/20 hover:text-danger' : 'bg-primary hover:bg-primary-200 text-white'
      } ${submitting ? 'opacity-60' : ''}`}
=======
      className={`ml-auto px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        following ? 'bg-surface-200 text-gray-300 hover:bg-danger/20 hover:text-danger' : 'bg-primary hover:bg-primary-200 text-white'
      }`}
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    >
      {following ? 'Unfollow' : 'Follow'}
    </button>
  );
}
