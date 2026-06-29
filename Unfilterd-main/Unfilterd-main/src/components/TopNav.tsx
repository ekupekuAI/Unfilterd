import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from './Avatar';
<<<<<<< HEAD
import { Bell, Search, SunMoon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
=======
import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

export function TopNav() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
<<<<<<< HEAD
  const { theme, toggleTheme } = useTheme();
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/5">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          UNFILTERD
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/search')}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            )}
          </button>
          <button
<<<<<<< HEAD
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <SunMoon className="w-5 h-5" />
          </button>
          <button
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
            onClick={() => navigate('/profile')}
            className="ml-1"
          >
            <Avatar seed={profile?.avatar_seed ?? 'default'} size="sm" />
          </button>
        </div>
      </div>
    </header>
  );
}
