import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { PageContainer, EmptyState } from '../components/Layout';

export function NotFoundPage() {
  return (
    <PageContainer>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you’re looking for does not exist."
        action={(
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        )}
      />
    </PageContainer>
  );
}
