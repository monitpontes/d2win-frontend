import * as React from 'react';
import type { Bridge, DashboardFilters } from '@/types';
import { Loader2 } from 'lucide-react';

const BridgesMapClient = React.lazy(() => import('./BridgesMapClient'));

interface BridgesMapProps {
  bridges: Bridge[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

/**
 * Wrapper client-only: evita crashes do React-Leaflet/Leaflet durante o bootstrap.
 * O código do mapa (que importa react-leaflet) fica isolado em BridgesMapClient.
 */
export function BridgesMap(props: BridgesMapProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex h-[450px] items-center justify-center bg-muted/30">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex h-[450px] items-center justify-center bg-muted/30">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <BridgesMapClient {...props} />
    </React.Suspense>
  );
}
