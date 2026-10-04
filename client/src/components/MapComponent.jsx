import { useEffect, useRef } from "react";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

/**
 * Creates custom SVG icon for cafe markers
 */
function createCafeIcon(isSelected = false) {
  const size = isSelected ? 42 : 34;
  const bg = isSelected ? "#f0d078" : "#d4a843";
  const border = isSelected ? "#ffffff" : "#1a1a1a";
  const shadow = isSelected ? "0 6px 18px rgba(240,208,120,0.6)" : "0 4px 12px rgba(0,0,0,0.5)";

  return L.divIcon({
    className: "cafe-map-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${shadow};
        border: 2px solid ${border};
        transition: transform 0.2s ease, width 0.2s ease, height 0.2s ease;
        cursor: pointer;
      ">
        <svg style="transform: rotate(45deg); width: ${size * 0.5}px; height: ${size * 0.5}px; color: #1a1a1a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
  });
}

/**
 * User location pin with pulsing ripple effect
 */
function createUserLocationIcon() {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function MapComponent({
  cafes = [],
  selectedCafe = null,
  onSelectCafe,
  center = [19.0760, 72.8777],
  zoom = 13,
  userCoords = null,
  autoFit = true,
  className = "w-full h-full min-h-[400px]",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const navigate = useNavigate();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap free tile provider
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle popup action button clicks delegated through map container
      const container = mapContainerRef.current;
      const handlePopupClick = (e) => {
        const detailBtn = e.target.closest("[data-view-cafe]");
        if (detailBtn) {
          const cafeId = detailBtn.getAttribute("data-view-cafe");
          if (cafeId) navigate(`/cafe/${cafeId}`);
        }
      };
      container.addEventListener("click", handlePopupClick);

      return () => {
        container.removeEventListener("click", handlePopupClick);
        map.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      };
    }
  }, []);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userCoords?.lat && userCoords?.lon) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lon], {
          icon: createUserLocationIcon(),
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup("<div style='padding: 6px 10px; font-weight: 600;'>📍 You are here</div>");
      } else {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lon]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Update Cafe Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let validCount = 0;

    cafes.forEach((cafe) => {
      // In GeoJSON, coordinates are [longitude, latitude]
      const lat = cafe.location?.coordinates?.[1];
      const lon = cafe.location?.coordinates?.[0];

      if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
        return;
      }

      const isSelected = selectedCafe?._id && selectedCafe._id === cafe._id;
      const marker = L.marker([lat, lon], {
        icon: createCafeIcon(isSelected),
      });

      // Construct popup HTML
      const photo = cafe.photo || cafe.photos?.[0] || "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg";
      const rating = cafe.rating ? Number(cafe.rating).toFixed(1) : "4.5";
      const reviews = cafe.reviewCount || 120;
      const cuisine = cafe.cuisine || "Coffee & Snacks";
      const address = cafe.address || "Address unavailable";

      const popupHtml = `
        <div style="width: 250px; overflow: hidden; border-radius: 16px; font-family: 'Poppins', sans-serif;">
          <div style="position: relative; height: 110px; width: 100%; background: #1a1a1a;">
            <img src="${photo}" alt="${cafe.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg';" />
            <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; color: #f0d078; display: flex; align-items: center; gap: 4px;">
              ★ ${rating} <span style="color: #bbb; font-weight: normal;">(${reviews})</span>
            </div>
            ${cafe.wifi ? '<span style="position: absolute; top: 8px; right: 8px; background: rgba(212,168,67,0.9); color: #000; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;">WiFi</span>' : ''}
          </div>
          <div style="padding: 12px; background: #242424; color: #fff;">
            <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${cafe.name}
            </h4>
            <p style="margin: 0 0 8px; font-size: 12px; color: #d4a843; font-weight: 500;">
              ${cuisine}
            </p>
            <p style="margin: 0 0 12px; font-size: 11px; color: #999; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              📍 ${address}
            </p>
            <div style="display: flex; gap: 8px;">
              <button 
                data-view-cafe="${cafe._id}" 
                style="flex: 1; padding: 7px 10px; background: #d4a843; color: #000; border: none; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;"
                onmouseover="this.style.opacity='0.9'"
                onmouseout="this.style.opacity='1'"
              >
                View Details
              </button>
              <a 
                href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords?.lat ? `${userCoords.lat},${userCoords.lon}%3B` : ''}${lat},${lon}"
                target="_blank"
                rel="noopener noreferrer"
                style="padding: 7px 10px; background: #333; color: #fff; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center;"
              >
                Directions ↗
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 270,
        className: "custom-leaflet-popup",
      });

      marker.on("click", () => {
        if (onSelectCafe) onSelectCafe(cafe);
      });

      group.addLayer(marker);
      markersRef.current.set(cafe._id, marker);
      bounds.extend([lat, lon]);
      validCount++;
    });

    // Auto fit bounds if enabled
    if (autoFit && validCount > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [cafes, userCoords]);

  // Handle selected cafe centering & popup open
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCafe) return;

    const lat = selectedCafe.location?.coordinates?.[1];
    const lon = selectedCafe.location?.coordinates?.[0];

    if (lat && lon) {
      map.flyTo([lat, lon], 15, { duration: 1 });
      const marker = markersRef.current.get(selectedCafe._id);
      if (marker) {
        marker.openPopup();
        // Update all marker icons so selected is highlighted
        markersRef.current.forEach((m, id) => {
          m.setIcon(createCafeIcon(id === selectedCafe._id));
        });
      }
    }
  }, [selectedCafe]);

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-2xl border border-dark-border ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
