import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, Search, LifeBuoy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [unread, setUnread] = useState(0);

  // refresh the badge on every navigation, so reading notifications clears it
  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user, location.pathname]);

  const iconButton = 'p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors relative';

  return (
    <header className="sticky top-0 z-30 bg-[#07060F]/70 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-semibold text-aurora tracking-tight" aria-label="Unfilterd home">
          Unfilterd
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/help" className="hidden sm:flex items-center gap-1.5 mr-1 px-3 py-1.5 rounded-full text-xs text-secondary-50 border border-secondary/25 hover:bg-secondary/10 transition-colors">
            <LifeBuoy className="w-3.5 h-3.5" /> Get help
          </Link>
          <Link to="/help" className={`sm:hidden ${iconButton}`} aria-label="Get help">
            <LifeBuoy className="w-5 h-5" />
          </Link>
          <button onClick={() => navigate('/search')} className={iconButton} aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/notifications')} className={iconButton} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-secondary text-ink rounded-full text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/profile')} className="ml-1 rounded-full ring-2 ring-transparent hover:ring-primary/40 transition" aria-label="Your profile">
            <Avatar seed={profile?.avatar_seed ?? 'default'} size="sm" />
          </button>
        </div>
      </div>
    </header>
  );
}
