import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Plus, User, Compass, Users, HeartHandshake, Wind } from 'lucide-react';

type Item = { path: string; icon: React.ElementType; label: string; desktopOnly?: boolean; primary?: boolean };

const navItems: Item[] = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/communities', icon: Users, label: 'Circles', desktopOnly: true },
  { path: '/create', icon: Plus, label: 'Post', primary: true },
  { path: '/matches', icon: HeartHandshake, label: 'Matches' },
  { path: '/breathe', icon: Wind, label: 'Breathe', desktopOnly: true },
  { path: '/profile', icon: User, label: 'You' },
];

function isActive(path: string, pathname: string) {
  if (path === '/') return pathname === '/' || pathname.startsWith('/post');
  if (path === '/matches') return pathname.startsWith('/matches') || pathname.startsWith('/chat');
  return pathname.startsWith(path);
}

/** Floating dock: full width on phones, a centred pill on larger screens. */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Main"
      className="fixed z-40 bottom-0 inset-x-0 md:bottom-5 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex items-center justify-around md:justify-center md:gap-1 px-2 py-2 md:px-2.5 bg-[#0D0B19]/85 backdrop-blur-xl border-t md:border border-white/[0.07] md:rounded-full md:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        {navItems.map(item => {
          const active = isActive(item.path, location.pathname);
          if (item.primary) {
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(item.path)}
                aria-label="Write a post"
                className="mx-1 w-12 h-12 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-primary-100 via-primary to-secondary flex items-center justify-center shadow-[0_8px_30px_-6px_rgba(157,124,255,0.8)]"
              >
                <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.button>
            );
          }
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-col md:flex-row items-center gap-0.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors ${
                item.desktopOnly ? 'hidden md:flex' : 'flex'
              } ${active ? 'text-white' : 'text-gray-500 hover:text-gray-200'}`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-white/[0.07] md:bg-primary/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <item.icon className="relative w-5 h-5" />
              <span className="relative text-[10px] md:text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
