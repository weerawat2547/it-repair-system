import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

// Fix default marker icon path (Vite/Webpack breaks Leaflet default icons)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  center: [number, number];
  initialCoords?: { lat: number; lng: number } | null;
  onSelect: (lat: number, lng: number) => void;
}

export default function LocationPicker({ center, initialCoords, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const onSelectRef  = useRef(onSelect);
  const [locating, setLocating] = useState(false);

  // Keep callback ref fresh without re-creating the map
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const placeMarker = useCallback((map: L.Map, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    onSelectRef.current(lat, lng);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const startView: [number, number] = initialCoords
      ? [initialCoords.lat, initialCoords.lng]
      : center;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(startView, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Show existing marker on open
    if (initialCoords) {
      markerRef.current = L.marker([initialCoords.lat, initialCoords.lng]).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(map, e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current  = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGPS = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        mapRef.current!.setView([latitude, longitude], 17);
        placeMarker(mapRef.current!, latitude, longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200" style={{ height: 420 }}>
      {/* GPS button — z-index above leaflet tiles */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={locating}
        className="absolute top-3 right-3 z-[1000] bg-white border border-slate-200 shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all"
      >
        <Navigation className={`size-4 text-blue-600 ${locating ? 'animate-pulse' : ''}`} />
        {locating ? 'กำลังระบุ...' : 'ตำแหน่งปัจจุบัน'}
      </button>

      {/* Click hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
        คลิกบนแผนที่เพื่อปักหมุด
      </div>

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
