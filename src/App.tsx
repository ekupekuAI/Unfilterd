import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { HomeFeedPage } from './pages/HomeFeed';
import { CreatePostPage } from './pages/CreatePost';
import { PostDetailPage } from './pages/PostDetail';
import { ProfilePage } from './pages/Profile';
import { UserProfilePage } from './pages/UserProfile';
import { SearchPage } from './pages/Search';
import { ExplorePage } from './pages/Explore';
import { CommunitiesPage } from './pages/Communities';
import { CommunityDetailPage } from './pages/CommunityDetail';
import { NotificationsPage } from './pages/Notifications';
import { MatchesPage } from './pages/Matches';
import { ChatPage } from './pages/Chat';
import { LandingPage } from './pages/Landing';
import { BreathePage } from './pages/Breathe';
import { HelpPage } from './pages/Help';
import { AdminPage } from './pages/Admin';
import { AnalyticsPage } from './pages/Analytics';
import { NotFoundPage } from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroGate } from './components/intro/IntroGate';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { LoadingSpinner, EmptyState } from './components/Layout';
import { ShieldAlert } from 'lucide-react';

function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (profile?.is_suspended) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Account suspended"
        description={profile.suspension_reason || 'This account is temporarily suspended by an administrator.'}
      />
    );
  }
  return (
    <>
      <TopNav />
      <AnimatedOutlet />
      <BottomNav />
    </>
  );
}

function ShortcutLayer() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        navigate('/search');
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        navigate('/create');
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return null;
}

// Each page fades and lifts in; the outgoing page fades out first.
function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {outlet}
      </motion.main>
    </AnimatePresence>
  );
}

// Signed-in people skip the marketing page.
function WelcomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner className="min-h-screen" />;
  return user ? <Navigate to="/" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ErrorBoundary>
        <AuthProvider>
          <ShortcutLayer />
          <IntroGate />
          <Routes>
          <Route path="/welcome" element={<WelcomeRoute />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/breathe" element={<BreathePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeFeedPage />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<UserProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/:id" element={<CommunityDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  );
}
