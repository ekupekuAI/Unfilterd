import { useLocation, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { Home, Search, PlusSquare, Bell, User, Compass, Users } from 'lucide-react';
=======
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react';
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
<<<<<<< HEAD
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/communities', icon: Users, label: 'Communities' },
=======
  { path: '/search', icon: Search, label: 'Search' },
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  { path: '/create', icon: PlusSquare, label: 'Post' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0));
<<<<<<< HEAD
  }, [user]);
=======
  }, [user, location.pathname]);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-white/5 md:hidden">
      <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path === '/' && location.pathname.startsWith('/post'));
          const showBadge = item.path === '/notifications' && unread > 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors relative ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {item.path === '/create' ? (
                <div className={`w-10 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-primary' : 'bg-surface-50'
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
              ) : (
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
