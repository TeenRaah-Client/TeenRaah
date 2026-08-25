import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Search, LocateFixed, Loader2 } from "lucide-react";
import api from "../../api/axios";

// Leaflet's default marker icon paths break under Vite's bundler, so we
// point them at the same CDN whose stylesheet is already loaded in index.html.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [19.076, 72.8777]; // Mumbai — sensible fallback if geolocation is denied

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 0.8 });
  }, [position, map]);
  return null;
};

const ClickToPlace = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

/**
 * props:
 *  - value: { lat, lng } | null
 *  - onChange: ({ lat, lng, city, state, pincode, displayName }) => void
 */
const MapPicker = ({ value, onChange }) => {
  const [position, setPosition] = useState(value ? [value.lat, value.lng] : DEFAULT_CENTER);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);

  const reverseAndEmit = useCallback(
    async (latlng) => {
      setPosition(latlng);
      try {
        const { data } = await api.get("/location/reverse", { params: { lat: latlng[0], lng: latlng[1] } });
        onChange({ lat: latlng[0], lng: latlng[1], ...data.result });
      } catch {
        onChange({ lat: latlng[0], lng: latlng[1], city: "", state: "", pincode: "", displayName: "" });
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/location/search", { params: { q: query } });
        setResults(data.results);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelectResult = (r) => {
    setResults([]);
    setQuery(r.displayName);
    setPosition([r.lat, r.lng]);
    onChange({ lat: r.lat, lng: r.lng, city: r.city, state: r.state, pincode: r.pincode, displayName: r.displayName });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        reverseAndEmit([pos.coords.latitude, pos.coords.longitude]).finally(() => setLocating(false));
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for area, street, landmark…"
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-stone" />}

        {results.length > 0 && (
          <div className="absolute z-[500] top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lift border border-ink/10 max-h-56 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-paper border-b border-ink/5 last:border-0"
              >
                {r.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={locating}
        className="flex items-center gap-2 text-sm font-semibold text-trail-600 mb-3"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
        Use my current location
      </button>

      <div className="rounded-2xl overflow-hidden border border-ink/10" style={{ height: 280 }}>
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => reverseAndEmit([e.target.getLatLng().lat, e.target.getLatLng().lng]),
            }}
          />
          <ClickToPlace onPick={reverseAndEmit} />
          <RecenterMap position={position} />
        </MapContainer>
      </div>
      <p className="text-xs text-stone mt-2">Tap the map or drag the pin to fine-tune your exact location.</p>
    </div>
  );
};

export default MapPicker;
