import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
}

interface PharmacyMapProps {
  locations: PharmacyLocation[];
  onMarkerClick?: (location: PharmacyLocation) => void;
}

export function PharmacyMap({ locations, onMarkerClick }: PharmacyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        // Load Leaflet JS
        const L = await import("leaflet");
        setLeaflet(L.default);
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!leaflet || !mapRef.current || map) return;

    // Determine center and zoom based on number of locations
    let centerLat, centerLng, zoomLevel;
    
    if (locations.length === 1) {
      // Single location - zoom in closer
      centerLat = locations[0].lat;
      centerLng = locations[0].lng;
      zoomLevel = 15;
    } else {
      // Multiple locations - use default Accra center
      centerLat = 5.6037;
      centerLng = -0.1870;
      zoomLevel = 12;
    }

    // Initialize map
    const mapInstance = leaflet.map(mapRef.current).setView([centerLat, centerLng], zoomLevel);

    // Add tile layer
    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Custom icon
    const customIcon = leaflet.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #BE322D 0%, #F16365 100%);
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 72, 255, 0.4);
          border: 3px solid white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
            <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
          </svg>
        </div>
      `,
      className: "",
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    // Add markers
    locations.forEach((location) => {
      const marker = leaflet
        .marker([location.lat, location.lng], { icon: customIcon })
        .addTo(mapInstance);

      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <h3 style="
            font-weight: 600;
            font-size: 16px;
            margin: 0 0 8px 0;
            color: #BE322D;
          ">${location.name}</h3>
          <p style="
            font-size: 13px;
            color: #666;
            margin: 0 0 6px 0;
            line-height: 1.4;
          ">${location.address}, ${location.city}</p>
          <p style="
            font-size: 13px;
            color: #666;
            margin: 0 0 10px 0;
          ">📞 <a href="tel:${location.phone}" style="color: #BE322D; text-decoration: none;">${location.phone}</a></p>
          <button
            onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}', '_blank')"
            style="
              background: linear-gradient(135deg, #BE322D 0%, #F16365 100%);
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              width: 100%;
              box-shadow: 0 2px 8px rgba(0, 72, 255, 0.2);
              transition: transform 0.2s;
            "
            onmouseover="this.style.transform='translateY(-1px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >🧭 Get Directions</button>
        </div>
      `);

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(location));
      }
    });

    setMap(mapInstance);

    // Cleanup
    return () => {
      mapInstance.remove();
    };
  }, [leaflet, locations, onMarkerClick]);

  if (!leaflet) {
    return (
      <div
        className="w-full h-[400px] rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "#FFF1F1" }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: "#BE322D" }} />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-xl overflow-hidden border-2"
      style={{ borderColor: "#F4D6D5" }}
    />
  );
}