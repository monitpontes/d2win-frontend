import * as React from 'react';
import { Loader2 } from 'lucide-react';
import type { Bridge } from '@/types';

/**
 * IMPORTANTE: este arquivo NÃO importa react-leaflet/leaflet.
 * Isso evita crashes intermitentes do React 18 + Vite quando módulos ESM do Leaflet
 * são avaliados cedo demais.
 */
const BridgesMapLeaflet = React.lazy(() => import('./BridgesMapLeaflet'));

interface BridgesMapProps {
  compact?: boolean;
  bridges?: Bridge[];
  onBridgeClick?: (bridgeId: string) => void;
}

export default function BridgesMapClient({ compact, bridges = [], onBridgeClick }: BridgesMapProps) {
  return (
    <React.Suspense
      fallback={
        <div className="rounded-lg border bg-card overflow-hidden h-full">
          <div className={`flex ${compact ? 'h-[200px]' : 'h-[350px]'} items-center justify-center bg-muted/30`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <BridgesMapLeaflet compact={compact} bridges={bridges} onBridgeClick={onBridgeClick} />
    </React.Suspense>
  );
}
