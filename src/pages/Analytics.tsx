import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageContainer, LoadingSpinner } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import type { Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { BarChart3, TrendingUp, Users, Flame, MessageSquare, Heart } from 'lucide-react';

type AnalyticsState = {
  users: number;
  posts: number;
  reports: number;
  follows: number;
  likes: number;
  comments: number;
  weeklyUsers: number;
  monthlyUsers: number;
  moods: Array<{ mood: Mood; count: number }>;
};

const defaultState: AnalyticsState = {
  users: 0,
  posts: 0,
  reports: 0,
  follows: 0,
  likes: 0,
  comments: 0,
  weeklyUsers: 0,
  monthlyUsers: 0,
  moods: [],
};

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AnalyticsState>(defaultState);

  useEffect(() => {
    const run = async () => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      const [users, posts, reports, follows, likes, comments, weeklyUsers, monthlyUsers, moodRows] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('follows').select('id', { count: 'exact', head: true }),
        supabase.from('likes').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
        supabase.from('posts').select('mood').limit(500),
      ]);
      const moodMap = new Map<Mood, number>();
      (moodRows.data ?? []).forEach(row => {
        const mood = row.mood as Mood;
        moodMap.set(mood, (moodMap.get(mood) ?? 0) + 1);
      });
      setState({
        users: users.count ?? 0,
        posts: posts.count ?? 0,
        reports: reports.count ?? 0,
        follows: follows.count ?? 0,
        likes: likes.count ?? 0,
        comments: comments.count ?? 0,
        weeklyUsers: weeklyUsers.count ?? 0,
        monthlyUsers: monthlyUsers.count ?? 0,
        moods: Array.from(moodMap.entries()).map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count),
      });
      setLoading(false);
    };
    run();
  }, []);

  const metrics = useMemo(() => [
    { label: 'Users', value: state.users, icon: Users },
    { label: 'Posts', value: state.posts, icon: MessageSquare },
    { label: 'Reports', value: state.reports, icon: BarChart3 },
    { label: 'Follows', value: state.follows, icon: TrendingUp },
    { label: 'Likes', value: state.likes, icon: Heart },
    { label: 'Comments', value: state.comments, icon: Flame },
  ], [state]);

  if (!profile?.is_admin) {
    return <PageContainer><LoadingSpinner /></PageContainer>;
  }

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

  const maxMood = Math.max(...state.moods.map(m => m.count), 1);

  return (
    <PageContainer>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Production metrics and activity trends.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {metrics.map(metric => (
          <div key={metric.label} className="bg-surface rounded-xl p-4">
            <metric.icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-gray-400">Weekly growth</p>
          <p className="text-2xl font-bold text-white">{state.weeklyUsers}</p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-gray-400">Monthly growth</p>
          <p className="text-2xl font-bold text-white">{state.monthlyUsers}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4 text-white font-medium">
          <BarChart3 className="w-4 h-4 text-secondary" />
          Trending moods
        </div>
        <div className="space-y-3">
          {state.moods.map(item => (
            <div key={item.mood}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{MOOD_CONFIG[item.mood].label}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-50 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxMood) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
