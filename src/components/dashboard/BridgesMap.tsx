import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Bridge, DashboardFilters } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, Filter, Layers } from 'lucide-react';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons based on status
const createCustomIcon = (status: Bridge['structuralStatus']) => {
  const colors = {
    normal: '#22c55e',
    alert: '#f59e0b',
    critical: '#ef4444',
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[status]};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg style="transform: rotate(45deg); width: 14px; height: 14px; color: white;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to handle map bounds
function MapBounds({ bridges }: { bridges: Bridge[] }) {
  const map = useMap();

  useEffect(() => {
    if (bridges.length > 0) {
      const validBridges = bridges.filter(b => b.coordinates);
      if (validBridges.length > 0) {
        const bounds = L.latLngBounds(
          validBridges.map(b => [b.coordinates!.lat, b.coordinates!.lng])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [bridges, map]);

  return null;
}

interface BridgesMapProps {
  bridges: Bridge[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function BridgesMap({ bridges, filters, onFiltersChange }: BridgesMapProps) {
  const navigate = useNavigate();
  const [mapFilter, setMapFilter] = useState<'all' | 'normal' | 'alert' | 'critical'>('all');

  const filteredBridges = useMemo(() => {
    let result = bridges.filter(b => b.coordinates);
    if (mapFilter !== 'all') {
      result = result.filter(b => b.structuralStatus === mapFilter);
    }
    return result;
  }, [bridges, mapFilter]);

  const getStatusBadgeVariant = (status: Bridge['structuralStatus']) => {
    switch (status) {
      case 'critical':
        return 'destructive';
      case 'alert':
        return 'warning' as const;
      default:
        return 'success' as const;
    }
  };

  const getStatusLabel = (status: Bridge['structuralStatus']) => {
    switch (status) {
      case 'critical':
        return 'Crítico';
      case 'alert':
        return 'Alerta';
      default:
        return 'Normal';
    }
  };

  // Brazil center coordinates
  const defaultCenter: [number, number] = [-15.7801, -47.9292];

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Mapa de Ativos</h3>
          <Badge variant="outline" className="ml-2">
            {filteredBridges.length} ativos
          </Badge>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={mapFilter} onValueChange={(v) => setMapFilter(v as typeof mapFilter)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alert">Alerta</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 border-b text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Alerta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Crítico</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[450px] w-full">
        <MapContainer
          center={defaultCenter}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds bridges={filteredBridges} />

          {filteredBridges.map((bridge) => (
            <Marker
              key={bridge.id}
              position={[bridge.coordinates!.lat, bridge.coordinates!.lng]}
              icon={createCustomIcon(bridge.structuralStatus)}
            >
              <Popup className="bridge-popup" minWidth={280}>
                <div className="p-1">
                  {/* Bridge Image */}
                  {bridge.image && (
                    <div className="mb-2 rounded overflow-hidden h-24">
                      <img
                        src={bridge.image}
                        alt={bridge.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Bridge Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-foreground">{bridge.name}</h4>
                      <Badge variant={getStatusBadgeVariant(bridge.structuralStatus)}>
                        {getStatusLabel(bridge.structuralStatus)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{bridge.location}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Tipologia:</span>
                        <span className="ml-1 font-medium">{bridge.typology}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rodovia:</span>
                        <span className="ml-1 font-medium">{bridge.rodovia}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">KM:</span>
                        <span className="ml-1 font-medium">{bridge.km}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sensores:</span>
                        <span className="ml-1 font-medium">{bridge.sensorCount}</span>
                      </div>
                    </div>

                    {bridge.hasActiveAlerts && (
                      <Badge variant="destructive" className="text-xs">
                        Alertas Ativos
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => navigate(`/bridge/${bridge.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
