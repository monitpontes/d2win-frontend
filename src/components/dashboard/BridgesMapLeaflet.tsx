import { useEffect, useMemo, useState, useRef } from 'react';
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
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
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

interface BridgesMapProps {
  bridges: Bridge[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export default function BridgesMapLeaflet({ bridges }: BridgesMapProps) {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const kmzLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [mapFilter, setMapFilter] = useState<'all' | 'normal' | 'alert' | 'critical'>('all');
  const [showKmz, setShowKmz] = useState(true);
  const [kmzLoaded, setKmzLoaded] = useState(false);

  const filteredBridges = useMemo(() => {
    let result = bridges.filter((b) => b.coordinates);
    if (mapFilter !== 'all') result = result.filter((b) => b.structuralStatus === mapFilter);
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

  const defaultCenter: [number, number] = [-15.7801, -47.9292];

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 4,
      scrollWheelZoom: true,
    });

    // Base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    );

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
      maxZoom: 17,
    });

    // Add default layer
    satelliteLayer.addTo(map);

    // Layer control
    const baseMaps = {
      'Satélite': satelliteLayer,
      'OpenStreetMap': osmLayer,
      'Topográfico': topoLayer,
    };

    L.control.layers(baseMaps, {}, { position: 'topright' }).addTo(map);

    // Create layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    kmzLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Load KMZ file
    loadKmzFile(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Load KMZ file using JSZip and manual parsing
  const loadKmzFile = async (map: L.Map) => {
    try {
      const JSZip = (await import('jszip')).default;
      
      const response = await fetch('/data/Novas_OAES.kmz');
      if (!response.ok) {
        console.warn('KMZ file not found');
        return;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Find the KML file inside the KMZ
      let kmlContent: string | null = null;
      for (const fileName of Object.keys(zip.files)) {
        if (fileName.endsWith('.kml')) {
          kmlContent = await zip.files[fileName].async('string');
          break;
        }
      }
      
      if (!kmlContent) {
        console.warn('No KML file found inside KMZ');
        return;
      }
      
      // Parse KML
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
      
      // Extract placemarks
      const placemarks = kmlDoc.getElementsByTagName('Placemark');
      const kmzGroup = kmzLayerRef.current;
      
      if (!kmzGroup) return;
      
      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const nameEl = placemark.getElementsByTagName('name')[0];
        const name = nameEl?.textContent || `Ponto ${i + 1}`;
        
        // Try to get coordinates from Point
        const pointEl = placemark.getElementsByTagName('Point')[0];
        if (pointEl) {
          const coordsEl = pointEl.getElementsByTagName('coordinates')[0];
          if (coordsEl && coordsEl.textContent) {
            const coords = coordsEl.textContent.trim().split(',');
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'kmz-marker',
                  html: `
                    <div style="
                      width: 24px;
                      height: 24px;
                      background: #3b82f6;
                      border-radius: 50%;
                      border: 2px solid white;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    "></div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                }),
              });
              
              marker.bindPopup(`<strong>${name}</strong><br/><small>Ponto do KMZ</small>`);
              kmzGroup.addLayer(marker);
            }
          }
        }
        
        // Try to get coordinates from LineString
        const lineEl = placemark.getElementsByTagName('LineString')[0];
        if (lineEl) {
          const coordsEl = lineEl.getElementsByTagName('coordinates')[0];
          if (coordsEl && coordsEl.textContent) {
            const coordPairs = coordsEl.textContent.trim().split(/\s+/);
            const latLngs: L.LatLng[] = [];
            
            for (const pair of coordPairs) {
              const [lng, lat] = pair.split(',').map(parseFloat);
              if (!isNaN(lat) && !isNaN(lng)) {
                latLngs.push(L.latLng(lat, lng));
              }
            }
            
            if (latLngs.length > 0) {
              const polyline = L.polyline(latLngs, {
                color: '#3b82f6',
                weight: 3,
              });
              polyline.bindPopup(`<strong>${name}</strong>`);
              kmzGroup.addLayer(polyline);
            }
          }
        }
        
        // Try to get coordinates from Polygon
        const polygonEl = placemark.getElementsByTagName('Polygon')[0];
        if (polygonEl) {
          const coordsEl = polygonEl.getElementsByTagName('coordinates')[0];
          if (coordsEl && coordsEl.textContent) {
            const coordPairs = coordsEl.textContent.trim().split(/\s+/);
            const latLngs: L.LatLng[] = [];
            
            for (const pair of coordPairs) {
              const [lng, lat] = pair.split(',').map(parseFloat);
              if (!isNaN(lat) && !isNaN(lng)) {
                latLngs.push(L.latLng(lat, lng));
              }
            }
            
            if (latLngs.length > 0) {
              const polygon = L.polygon(latLngs, {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
              });
              polygon.bindPopup(`<strong>${name}</strong>`);
              kmzGroup.addLayer(polygon);
            }
          }
        }
      }
      
      setKmzLoaded(true);
      console.log(`[KMZ] Loaded ${placemarks.length} placemarks`);
      
    } catch (error) {
      console.error('[KMZ] Failed to load:', error);
    }
  };

  // Update markers when bridges or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    
    if (!map || !markersLayer) return;
    
    // Clear existing markers
    markersLayer.clearLayers();
    
    // Add bridge markers
    filteredBridges.forEach((bridge) => {
      if (!bridge.coordinates) return;
      
      const marker = L.marker([bridge.coordinates.lat, bridge.coordinates.lng], {
        icon: createCustomIcon(bridge.structuralStatus),
      });
      
      const popupContent = `
        <div style="min-width: 260px; font-family: system-ui, -apple-system, sans-serif;">
          ${bridge.image ? `<img src="${bridge.image}" alt="${bridge.name}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />` : ''}
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <strong style="font-size: 14px;">${bridge.name}</strong>
            <span style="
              background: ${bridge.structuralStatus === 'critical' ? '#ef4444' : bridge.structuralStatus === 'alert' ? '#f59e0b' : '#22c55e'};
              color: white;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 500;
            ">${getStatusLabel(bridge.structuralStatus)}</span>
          </div>
          <p style="color: #666; font-size: 12px; margin: 4px 0;">${bridge.location}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-top: 8px;">
            <div><span style="color: #888;">Tipologia:</span> <strong>${bridge.typology}</strong></div>
            <div><span style="color: #888;">Rodovia:</span> <strong>${bridge.rodovia}</strong></div>
            <div><span style="color: #888;">KM:</span> <strong>${bridge.km}</strong></div>
            <div><span style="color: #888;">Sensores:</span> <strong>${bridge.sensorCount}</strong></div>
          </div>
          ${bridge.hasActiveAlerts ? '<div style="margin-top: 8px;"><span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Alertas Ativos</span></div>' : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent, { minWidth: 280 });
      
      // Add click to navigate
      marker.on('popupopen', () => {
        const popup = marker.getPopup();
        if (popup) {
          const container = popup.getElement();
          if (container) {
            // Add navigation button after popup opens
            setTimeout(() => {
              const btn = container.querySelector('.bridge-nav-btn');
              if (btn) {
                btn.addEventListener('click', () => navigate(`/bridge/${bridge.id}`));
              }
            }, 0);
          }
        }
      });
      
      markersLayer.addLayer(marker);
    });
    
    // Fit bounds
    if (filteredBridges.length > 0) {
      const bounds = L.latLngBounds(
        filteredBridges.map((b) => [b.coordinates!.lat, b.coordinates!.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [filteredBridges, navigate]);

  // Toggle KMZ visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    const kmzLayer = kmzLayerRef.current;
    
    if (!map || !kmzLayer) return;
    
    if (showKmz) {
      if (!map.hasLayer(kmzLayer)) {
        kmzLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(kmzLayer)) {
        map.removeLayer(kmzLayer);
      }
    }
  }, [showKmz]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Mapa de Ativos</h3>
          <Badge variant="outline" className="ml-2">
            {filteredBridges.length} ativos
          </Badge>
          {kmzLoaded && (
            <Badge variant="secondary" className="ml-1">
              + KMZ
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {kmzLoaded && (
            <Button
              variant={showKmz ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowKmz(!showKmz)}
              className="h-8"
            >
              <Layers className="h-4 w-4 mr-1" />
              KMZ
            </Button>
          )}
          
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
        {kmzLoaded && (
          <div className="flex items-center gap-1.5 ml-4">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">KMZ</span>
          </div>
        )}
      </div>

      <div ref={mapContainerRef} className="h-[450px] w-full" />
    </div>
  );
}
