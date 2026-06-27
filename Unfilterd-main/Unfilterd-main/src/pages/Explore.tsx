import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { PostCard } from '../components/PostCard';
import { PageContainer, LoadingSpinner } from '../components/Layout';
import { Flame, Sparkles, Clock3, Compass, Users, Sparkles as Spark } from 'lucide-react';

const moods = (Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).filter(([m]) => m !== 'random');

export function ExplorePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<Post[]>([]);
  const [weekly, setWeekly] = useState<Post[]>([]);
  const [recent, setRecent] = useState<Post[]>([]);
  const [recommended, setRecommended] = useState<Post[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const [trendingRes, weeklyRes, recentRes, recommendedRes] = await Promise.all([
        supabase.from('posts').select('*, profiles(username, avatar_seed), post_media(*)').order('like_count', { ascending: false }).limit(8),
        supabase.from('posts').select('*, profiles(username, avatar_seed), post_media(*)').gte('created_at', weekAgo.toISOString()).order('created_at', { ascending: false }).limit(8),
        supabase.from('posts').select('*, profiles(username, avatar_seed), post_media(*)').order('created_at', { ascending: false }).limit(8),
        user
          ? supabase.from('posts').select('*, profiles(username, avatar_seed), post_media(*)').in('mood', ['happy', 'motivation', 'relationship', 'career']).order('saves_count', { ascending: false }).limit(8)
          : supabase.from('posts').select('*, profiles(username, avatar_seed), post_media(*)').order('like_count', { ascending: false }).limit(8),
      ]);
      setTrending((trendingRes.data ?? []) as Post[]);
      setWeekly((weeklyRes.data ?? []) as Post[]);
      setRecent((recentRes.data ?? []) as Post[]);
      setRecommended((recommendedRes.data ?? []) as Post[]);
      setLoading(false);
    };
    run();
  }, [user]);

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Explore</h1>
          <p className="text-sm text-gray-400 mt-1">Trending posts, categories, and fresh activity.</p>
        </div>
        <Compass className="w-6 h-6 text-primary" />
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Flame className="w-4 h-4 text-warning" /> Trending</div>
          <div className="space-y-4">{trending.map(p => <PostCard key={p.id} post={p} compact />)}</div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Sparkles className="w-4 h-4 text-primary" /> Popular this week</div>
          <div className="space-y-4">{weekly.map(p => <PostCard key={p.id} post={p} compact />)}</div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Clock3 className="w-4 h-4 text-secondary" /> New posts</div>
          <div className="space-y-4">{recent.map(p => <PostCard key={p.id} post={p} compact />)}</div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Spark className="w-4 h-4 text-primary" /> Recommended</div>
          <div className="space-y-4">{recommended.map(p => <PostCard key={p.id} post={p} compact />)}</div>
        </section>
        <section className="space-y-3">
          <div className="text-white font-medium">Categories</div>
          <div className="grid grid-cols-2 gap-2">
            {moods.map(([key, config]) => (
              <Link key={key} to={`/search?mood=${key}`} className={`px-4 py-3 rounded-xl text-sm font-medium ${config.bg} ${config.color}`}>
                {config.label}
              </Link>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Users className="w-4 h-4 text-secondary" /> Communities</div>
          <Link to="/communities" className="block px-4 py-3 rounded-xl bg-surface-50 text-sm text-gray-200 hover:text-white">
            Browse communities
          </Link>
        </section>
      </div>
    </PageContainer>
  );
}
