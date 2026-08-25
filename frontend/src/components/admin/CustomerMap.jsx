import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const INDIA_CENTER = [22.3511, 78.6677];

/** props: pins: [{ customerName, customerEmail, customerPhone, label, city, state, lat, lng }] */
const CustomerMap = ({ pins }) => {
  const center = pins.length > 0 ? [pins[0].lat, pins[0].lng] : INDIA_CENTER;

  return (
    <div className="rounded-2xl overflow-hidden border border-ink/10" style={{ height: 420 }}>
      <MapContainer center={center} zoom={pins.length ? 11 : 5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin, i) => (
          <Marker key={i} position={[pin.lat, pin.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{pin.customerName}</p>
                <p className="text-xs text-stone">{pin.customerEmail}</p>
                <p className="text-xs text-stone">{pin.customerPhone}</p>
                <p className="text-xs mt-1">
                  {pin.label} · {pin.city}, {pin.state}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CustomerMap;
