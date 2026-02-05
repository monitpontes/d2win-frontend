import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { Bridge, StructuralStatus } from '@/types';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Status color mapping
const statusColors: Record<StructuralStatus, string> = {
  operacional: '#22c55e', // green
  atencao: '#f59e0b', // yellow
  restricoes: '#f97316', // orange
  critico: '#ef4444', // red
  interdicao: '#b91c1c', // dark red
};

interface BridgesMapProps {
  compact?: boolean;
  bridges?: Bridge[];
  onBridgeClick?: (bridgeId: string) => void;
}

export default function BridgesMapLeaflet({ compact = false, bridges = [], onBridgeClick }: BridgesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const kmzLayerRef = useRef<L.LayerGroup | null>(null);
  const bridgeMarkersRef = useRef<L.LayerGroup | null>(null);
  

  const defaultCenter: [number, number] = [-15.7801, -47.9292];

  // Create custom icon for bridge markers
  const createBridgeIcon = (status: StructuralStatus) => {
    const color = statusColors[status] || '#3b82f6';
    return L.divIcon({
      className: 'bridge-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M4 6l2 14h12l2-14"/>
            <path d="M2 6h20"/>
            <path d="M12 6V2"/>
            <path d="M6 6V4"/>
            <path d="M18 6V4"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

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

    // Create layer groups
    kmzLayerRef.current = L.layerGroup().addTo(map);
    bridgeMarkersRef.current = L.layerGroup().addTo(map);

    // Layer control
    const baseMaps = {
      'Satélite': satelliteLayer,
      'OpenStreetMap': osmLayer,
      'Topográfico': topoLayer,
    };

    const overlayMaps = {
      'Pontes': bridgeMarkersRef.current,
    };

    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update bridge markers when bridges change
  useEffect(() => {
    const bridgeGroup = bridgeMarkersRef.current;
    const kmzGroup = kmzLayerRef.current;
    const map = mapInstanceRef.current;
    if (!bridgeGroup || !kmzGroup || !map) return;

    // Clear existing markers
    bridgeGroup.clearLayers();
    kmzGroup.clearLayers();

    // Add bridge markers (only bridges with coordinates)
    const bridgesWithCoords = bridges.filter(b => b.coordinates?.lat && b.coordinates?.lng);
    
    bridgesWithCoords.forEach(bridge => {
      if (bridge.coordinates) {
        const marker = L.marker([bridge.coordinates.lat, bridge.coordinates.lng], {
          icon: createBridgeIcon(bridge.structuralStatus),
        });

        // Click handler for filtering
        marker.on('click', () => {
          if (onBridgeClick) {
            onBridgeClick(bridge.id);
          }
        });

        // Popup with bridge info - using "-" for empty values
        const formatPopupValue = (value: any) => value || '-';
        
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong style="font-size: 14px;">${bridge.name}</strong>
            <hr style="margin: 8px 0; border-color: #eee;">
            <div style="font-size: 12px; line-height: 1.5;">
              <p><b>Tipologia:</b> ${formatPopupValue(bridge.typology)}</p>
              <p><b>Rodovia:</b> ${formatPopupValue(bridge.rodovia)}</p>
              <p><b>KM:</b> ${formatPopupValue(bridge.km)}</p>
              <p><b>Sensores:</b> ${bridge.sensorCount || '-'}</p>
              <p><b>Status:</b> ${formatPopupValue(bridge.structuralStatus)}</p>
            </div>
            <a href="/bridge/${bridge.id}" style="
              display: block;
              margin-top: 8px;
              padding: 6px 12px;
              background: #3b82f6;
              color: white;
              text-align: center;
              text-decoration: none;
              border-radius: 4px;
              font-size: 12px;
            ">Ver Detalhes</a>
          </div>
        `);

        bridgeGroup.addLayer(marker);
      }
    });

    // Load individual KMZ files for bridges that have them
    bridges.forEach(bridge => {
      if (bridge.kmzFile) {
        loadBridgeKmz(bridge, map, kmzGroup);
      }
    });

    // Fit bounds to include bridges if any have coordinates
    if (bridgesWithCoords.length > 0) {
      const allLayers = [...bridgeGroup.getLayers()];
      if (kmzGroup.getLayers().length > 0) {
        allLayers.push(...kmzGroup.getLayers());
      }
      if (allLayers.length > 0) {
        const featureGroup = L.featureGroup(allLayers);
        const bounds = featureGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      }
    }
  }, [bridges, onBridgeClick]);

  // Load per-bridge KMZ file if available
  const loadBridgeKmz = async (bridge: Bridge, map: L.Map, kmzGroup: L.LayerGroup) => {
    if (!bridge.kmzFile) return;
    
    try {
      const JSZip = (await import('jszip')).default;
      
      const response = await fetch(bridge.kmzFile);
      if (!response.ok) return;
      
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
      
      if (!kmlContent) return;
      
      // Parse KML and add markers
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
      const placemarks = kmlDoc.getElementsByTagName('Placemark');
      
      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const nameEl = placemark.getElementsByTagName('name')[0];
        const name = nameEl?.textContent || `${bridge.name} - Ponto ${i + 1}`;
        
        const pointEl = placemark.getElementsByTagName('Point')[0];
        if (pointEl) {
          const coordsEl = pointEl.getElementsByTagName('coordinates')[0];
          if (coordsEl && coordsEl.textContent) {
            const coords = coordsEl.textContent.trim().split(',');
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = L.marker([lat, lng], {
                icon: createBridgeIcon(bridge.structuralStatus),
              });
              
              marker.on('click', () => {
                if (onBridgeClick) {
                  onBridgeClick(bridge.id);
                }
              });
              
              marker.bindPopup(`<strong>${name}</strong><br/><small>${bridge.name}</small>`);
              kmzGroup.addLayer(marker);
            }
          }
        }
      }
      
      console.log(`[KMZ] Loaded KMZ for bridge ${bridge.name}`);
    } catch (error) {
      console.error(`[KMZ] Failed to load KMZ for bridge ${bridge.name}:`, error);
    }
  };

  const mapHeight = compact ? 'h-[200px]' : 'h-[350px]';
  const bridgesWithCoords = bridges.filter(b => b.coordinates?.lat && b.coordinates?.lng).length;

  return (
    <div className="rounded-lg border bg-card overflow-hidden h-full">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Localização dos Ativos</h3>
          {bridgesWithCoords > 0 && (
            <Badge variant="default" className="text-xs">
              {bridgesWithCoords} {bridgesWithCoords === 1 ? 'ponte' : 'pontes'}
            </Badge>
          )}
          {bridgesWithCoords === 0 && (
            <Badge variant="secondary" className="text-xs">
              Nenhuma ponte com coordenadas
            </Badge>
          )}
        </div>
      </div>

      <div ref={mapContainerRef} className={`${mapHeight} w-full`} />
    </div>
  );
}
