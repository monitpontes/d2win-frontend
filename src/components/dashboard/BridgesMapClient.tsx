import * as React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * IMPORTANTE: este arquivo NÃO importa react-leaflet/leaflet.
 * Isso evita crashes intermitentes do React 18 + Vite quando módulos ESM do Leaflet
 * são avaliados cedo demais.
 */
const BridgesMapLeaflet = React.lazy(() => import('./BridgesMapLeaflet'));

interface BridgesMapProps {
  compact?: boolean;
}

export default function BridgesMapClient({ compact }: BridgesMapProps) {
  return (
    <React.Suspense
      fallback={
        <div className="rounded-lg border bg-card overflow-hidden h-full">
          <div className={`flex ${compact ? 'h-[280px]' : 'h-[400px]'} items-center justify-center bg-muted/30`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <BridgesMapLeaflet compact={compact} />
    </React.Suspense>
  );
}
