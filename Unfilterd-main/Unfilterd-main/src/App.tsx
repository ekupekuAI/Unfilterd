<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
=======
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
import { HomeFeedPage } from './pages/HomeFeed';
import { CreatePostPage } from './pages/CreatePost';
import { PostDetailPage } from './pages/PostDetail';
import { ProfilePage } from './pages/Profile';
<<<<<<< HEAD
import { UserProfilePage } from './pages/UserProfile';
import { SearchPage } from './pages/Search';
import { ExplorePage } from './pages/Explore';
import { CommunitiesPage } from './pages/Communities';
import { CommunityDetailPage } from './pages/CommunityDetail';
import { NotificationsPage } from './pages/Notifications';
import { AdminPage } from './pages/Admin';
import { AnalyticsPage } from './pages/Analytics';
import { NotFoundPage } from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StartupAnimation } from './components/SplashScreen/StartupAnimation';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { LoadingSpinner, EmptyState } from './components/Layout';
import { ShieldAlert } from 'lucide-react';
import { useStartupAnimation } from './hooks/useStartupAnimation';

function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.is_suspended) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Account suspended"
        description={profile.suspension_reason || 'This account is temporarily suspended by an administrator.'}
      />
    );
  }
=======
import { SearchPage } from './pages/Search';
import { NotificationsPage } from './pages/Notifications';
import { AdminPage } from './pages/Admin';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { LoadingSpinner } from './components/Layout';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  return (
    <>
      <TopNav />
      <Outlet />
      <BottomNav />
    </>
  );
}

<<<<<<< HEAD
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

function StartupLayer() {
  const startup = useStartupAnimation();
  return <StartupAnimation active={startup.active} phase={startup.phase} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ErrorBoundary>
        <AuthProvider>
          <ShortcutLayer />
          <StartupLayer />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
=======
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeFeedPage />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
<<<<<<< HEAD
            <Route path="/profile/:id" element={<UserProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/:id" element={<CommunityDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
=======
            <Route path="/search" element={<SearchPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    </BrowserRouter>
  );
}
