import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BridgesMapClient = React.lazy(() => import('./BridgesMapClient'));

interface BridgesMapProps {
  compact?: boolean;
}

/**
 * Wrapper client-only: evita crashes do React-Leaflet/Leaflet durante o bootstrap.
 * O código do mapa (que importa react-leaflet) fica isolado em BridgesMapClient.
 */
export function BridgesMap({ compact = false }: BridgesMapProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const mapHeight = compact ? 'h-[280px]' : 'h-[400px]';

  if (!mounted) {
    return (
      <div className="rounded-lg border bg-card overflow-hidden h-full">
        <div className={`flex ${mapHeight} items-center justify-center bg-muted/30`}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(err) => {
        // eslint-disable-next-line no-console
        console.error('[BridgesMap] crashed', err);
      }}
      fallback={
        <div className="rounded-lg border bg-card overflow-hidden h-full">
          <div className={`flex ${mapHeight} items-center justify-center bg-muted/30 p-6 text-center`}>
            <div>
              <p className="text-sm font-medium text-foreground">Não foi possível carregar o mapa.</p>
              <p className="mt-1 text-sm text-muted-foreground">Recarregue a página para tentar novamente.</p>
            </div>
          </div>
        </div>
      }
    >
      <React.Suspense
        fallback={
          <div className="rounded-lg border bg-card overflow-hidden h-full">
            <div className={`flex ${mapHeight} items-center justify-center bg-muted/30`}>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        }
      >
        <BridgesMapClient compact={compact} />
      </React.Suspense>
    </ErrorBoundary>
  );
}
