import * as React from 'react';
import type { Bridge, DashboardFilters } from '@/types';
import { Loader2 } from 'lucide-react';

/**
 * IMPORTANTE: este arquivo NÃO importa react-leaflet/leaflet.
 * Isso evita crashes intermitentes do React 18 + Vite quando módulos ESM do Leaflet
 * são avaliados cedo demais.
 */
const BridgesMapLeaflet = React.lazy(() => import('./BridgesMapLeaflet'));

interface BridgesMapProps {
  bridges: Bridge[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export default function BridgesMapClient(props: BridgesMapProps) {
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
      <BridgesMapLeaflet {...props} />
    </React.Suspense>
  );
}
