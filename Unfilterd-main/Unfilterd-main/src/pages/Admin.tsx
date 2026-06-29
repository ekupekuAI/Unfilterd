import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Report } from '../types';
import { PageContainer, PageHeader, EmptyState, LoadingSpinner } from '../components/Layout';
<<<<<<< HEAD
import { Shield, Users, FileText, AlertTriangle, CheckCircle, XCircle, Eye, Trash2, MessageSquareWarning } from 'lucide-react';

type RecentUser = {
  id: string;
  username: string;
  is_suspended: boolean;
  suspension_reason: string;
};

type ModerationQueueItem = {
  id: string;
  kind: 'post' | 'comment' | 'user';
  title: string;
  target_id: string | null;
  status: string;
  description: string;
  created_at: string;
};

export function AdminPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0, active: 0, communities: 0, comments: 0, dailyActive: 0, weeklyGrowth: 0, monthlyGrowth: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'reports'>('overview');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const [usersRes, postsRes, reportsRes, recentUsersRes, communitiesRes, commentsRes, dailyRes, weeklyRes, monthlyRes, queueRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, username, is_suspended, suspension_reason').order('created_at', { ascending: false }).limit(8),
      supabase.from('communities').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
      supabase.from('moderation_actions').select('id, action_type, target_type, target_id, reason, created_at').order('created_at', { ascending: false }).limit(12),
    ]);

    const firstError = usersRes.error ?? postsRes.error ?? reportsRes.error ?? recentUsersRes.error ?? communitiesRes.error ?? commentsRes.error ?? dailyRes.error ?? weeklyRes.error ?? monthlyRes.error ?? queueRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

=======
import { Shield, Users, FileText, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

export function AdminPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0, active: 0 });
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'reports'>('overview');

  const fetchData = useCallback(async () => {
    const [usersRes, postsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);

>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    setStats({
      users: usersRes.count ?? 0,
      posts: postsRes.count ?? 0,
      reports: reportsRes.data?.length ?? 0,
      active: usersRes.count ?? 0,
<<<<<<< HEAD
      communities: communitiesRes.count ?? 0,
      comments: commentsRes.count ?? 0,
      dailyActive: dailyRes.count ?? 0,
      weeklyGrowth: weeklyRes.count ?? 0,
      monthlyGrowth: monthlyRes.count ?? 0,
    });
    setReports((reportsRes.data ?? []) as Report[]);
    setRecentUsers((recentUsersRes.data ?? []) as RecentUser[]);
    setQueue(((queueRes.data ?? []).map(row => ({
      id: row.id,
      kind: (row.target_type as ModerationQueueItem['kind']) || 'post',
      title: row.action_type,
      target_id: row.target_id,
      status: 'queued',
      description: row.reason || '',
      created_at: row.created_at,
    })) as ModerationQueueItem[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!profile.is_admin) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, profile]);
=======
    });
    setReports((reportsRes.data ?? []) as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  if (!profile?.is_admin) {
    return (
      <PageContainer>
        <EmptyState
          icon={Shield}
          title="Access Denied"
          description="You don't have admin privileges to view this page"
        />
      </PageContainer>
    );
  }

  const handleReport = async (id: string, status: 'resolved' | 'dismissed') => {
<<<<<<< HEAD
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status, admin_response: `Report ${status}` })
      .eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setReports(prev => prev.filter(r => r.id !== id));
    setStats(s => ({ ...s, reports: Math.max(s.reports - 1, 0) }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!postId) return;
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    fetchData();
  };

  const handleSuspendUser = async (userId: string, suspended: boolean) => {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_suspended: suspended,
        suspension_reason: suspended ? 'Suspended by admin' : '',
      })
      .eq('id', userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    fetchData();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) setError(deleteError.message);
    else fetchData();
  };

  const handleWarnUser = async (userId: string) => {
    const { error: insertError } = await supabase.from('moderation_actions').insert({
      admin_id: profile?.id,
      action_type: 'warning',
      target_type: 'user',
      target_id: userId,
      reason: 'Moderator warning',
    });
    if (insertError) setError(insertError.message);
=======
    await supabase.from('reports').update({ status, admin_response: `Report ${status}` }).eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
    setStats(s => ({ ...s, reports: s.reports - 1 }));
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  };

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-primary' },
    { label: 'Total Posts', value: stats.posts, icon: FileText, color: 'text-secondary' },
    { label: 'Pending Reports', value: stats.reports, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Active Users', value: stats.active, icon: Eye, color: 'text-success' },
<<<<<<< HEAD
    { label: 'Communities', value: stats.communities, icon: Shield, color: 'text-primary' },
    { label: 'Comments', value: stats.comments, icon: MessageSquareWarning, color: 'text-secondary' },
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  ];

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Admin Dashboard" subtitle="Moderate and manage the platform" />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'overview' ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'reports' ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400'
          }`}
        >
          Reports ({stats.reports})
        </button>
      </div>

<<<<<<< HEAD
      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-sm text-danger-50">{error}</p>
        </div>
      )}

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(s => (
              <div key={s.label} className="bg-surface rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-gray-400">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-xl p-4">
              <p className="text-xs text-gray-400">DAU</p>
              <p className="text-xl font-bold text-white">{stats.dailyActive}</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <p className="text-xs text-gray-400">Weekly growth</p>
              <p className="text-xl font-bold text-white">{stats.weeklyGrowth}</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <p className="text-xs text-gray-400">Monthly growth</p>
              <p className="text-xl font-bold text-white">{stats.monthlyGrowth}</p>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">User Status</h3>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{u.username}</p>
                    <p className="text-xs text-gray-500">
                      {u.is_suspended ? `Suspended: ${u.suspension_reason || 'No reason provided'}` : 'Active'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSuspendUser(u.id, !u.is_suspended)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      u.is_suspended ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-danger/20 text-danger hover:bg-danger/30'
                    }`}
                  >
                    {u.is_suspended ? 'Reinstate' : 'Suspend'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Moderation queue</h3>
            <div className="space-y-2">
              {queue.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.kind} · {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.target_id && item.kind === 'comment' && (
                      <button onClick={() => handleDeleteComment(item.target_id!)} className="px-3 py-1.5 rounded-lg text-xs bg-danger/20 text-danger">Delete</button>
                    )}
                    {item.target_id && item.kind === 'user' && (
                      <button onClick={() => handleWarnUser(item.target_id!)} className="px-3 py-1.5 rounded-lg text-xs bg-warning/20 text-warning">Warn</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
=======
      {tab === 'overview' ? (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-surface rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={CheckCircle} title="All clear!" description="No pending reports to review" />
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-surface rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <span className="text-sm font-medium text-white capitalize">{r.reason.replace('_', ' ')}</span>
                  </div>
                  {r.description && <p className="text-xs text-gray-400 mt-1">{r.description}</p>}
                  <p className="text-xs text-gray-600 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReport(r.id, 'resolved')}
                    className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
                    title="Resolve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
<<<<<<< HEAD
                    onClick={() => handleDeletePost(r.post_id ?? '')}
                    disabled={!r.post_id}
                    className="p-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 disabled:opacity-40 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
                    onClick={() => handleReport(r.id, 'dismissed')}
                    className="p-2 rounded-lg bg-surface-200 text-gray-400 hover:bg-danger/20 hover:text-danger transition-colors"
                    title="Dismiss"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
