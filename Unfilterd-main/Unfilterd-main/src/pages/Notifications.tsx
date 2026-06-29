import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Notification } from '../types';
import { PageContainer, EmptyState, LoadingSpinner } from '../components/Layout';
import { Bell, Heart, MessageCircle, CornerDownRight, Megaphone, Check } from 'lucide-react';

const typeConfig = {
  like: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/20' },
  comment: { icon: MessageCircle, color: 'text-secondary', bg: 'bg-secondary/20' },
  reply: { icon: CornerDownRight, color: 'text-primary-50', bg: 'bg-primary/20' },
  system: { icon: Megaphone, color: 'text-warning', bg: 'bg-warning/20' },
};
<<<<<<< HEAD
const fallbackNotificationType = typeConfig.system;
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['type']>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setError('');
    const { data, error: queryError } = await supabase
=======

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
<<<<<<< HEAD
    if (queryError) {
      setNotifications([]);
      setError(queryError.message);
      setLoading(false);
      return;
    }
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
<<<<<<< HEAD
    const { error: updateError } = await supabase
=======
    await supabase
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
<<<<<<< HEAD
    if (updateError) {
      setError(updateError.message);
      return;
    }
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
<<<<<<< HEAD
    const { error: updateError } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
=======
    await supabase.from('notifications').update({ read: true }).eq('id', id);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
<<<<<<< HEAD
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-50 font-medium transition-colors mt-2"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

<<<<<<< HEAD
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'unread', 'like', 'comment', 'reply', 'system'] as const).map(item => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === item ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400 hover:text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-sm text-danger-50">{error}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="When someone interacts with your posts, you'll see it here" />
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const config = typeConfig[n.type as keyof typeof typeConfig] ?? fallbackNotificationType;
=======
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="When someone interacts with your posts, you'll see it here" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const config = typeConfig[n.type];
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-3 p-4 rounded-xl transition-colors cursor-pointer ${
                  n.read ? 'bg-surface/50' : 'bg-surface border-l-2 border-primary'
                } hover:bg-surface-50/50`}
              >
                <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-gray-400' : 'text-white'}`}>
                    {n.message || `Someone ${n.type === 'like' ? 'liked' : n.type === 'comment' ? 'commented on' : n.type === 'reply' ? 'replied to' : 'announced'} your post`}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {n.post_id && (
                  <Link
                    to={`/post/${n.post_id}`}
                    className="text-xs text-primary hover:text-primary-50 shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
