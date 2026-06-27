import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { PageContainer, EmptyState } from './Layout';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageContainer>
          <EmptyState
            icon={AlertTriangle}
            title="Something went wrong"
            description="Reload the page or try again in a moment."
            action={(
              <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm">
                <RefreshCcw className="w-4 h-4" />
                Reload
              </button>
            )}
          />
        </PageContainer>
      );
    }
    return this.props.children;
  }
}
