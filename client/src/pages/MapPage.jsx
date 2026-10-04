import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  Wifi,
  Sun,
  PackageCheck,
  List,
  Coffee,
  Star,
  ChevronRight,
  X,
  Compass,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import { API } from "../config";

export default function MapPage() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAmenities, setActiveAmenities] = useState([]);
  const [userLocationName, setUserLocationName] = useState(
    () => localStorage.getItem("userLocation") || "Mumbai"
  );
  const [userCoords, setUserCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.076, 72.8777]); // Mumbai default
  const carouselRef = useRef(null);

  // Dynamically compute category filters from current cafes in dataset
  const dynamicCategories = useMemo(() => {
    const cuisineSet = new Set();
    if (Array.isArray(cafes)) {
      cafes.forEach((c) => {
        if (c?.cuisine) {
          const main = c.cuisine.split(",")[0].trim();
          if (main && main !== "Coffee & Snacks") cuisineSet.add(main);
        }
      });
    }

    const list = [{ id: "all", name: "All Cafes" }];
    cuisineSet.forEach((c) => {
      list.push({ id: c.toLowerCase(), name: c });
    });

    if (list.length <= 2) {
      list.push(
        { id: "specialty coffee", name: "Specialty Coffee" },
        { id: "artisan bakery", name: "Artisan Bakery" },
        { id: "bistro & brunch", name: "Bistro & Brunch" }
      );
    }
    return list;
  }, [cafes]);

  useEffect(() => {
    fetchCafes();
  }, [userLocationName]);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/cafes?location=${encodeURIComponent(userLocationName)}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: Check if MongoDB Atlas is connected`);
      }
      const data = await res.json();
      const list = Array.isArray(data.cafes) ? data.cafes : Array.isArray(data) ? data : [];
      setCafes(list);
      if (data.coordinates?.lat && data.coordinates?.lon) {
        setMapCenter([data.coordinates.lat, data.coordinates.lon]);
      } else if (list.length > 0 && list[0].location?.coordinates) {
        setMapCenter([list[0].location.coordinates[1], list[0].location.coordinates[0]]);
      }
    } catch (err) {
      console.warn("Error fetching cafes:", err);
      setError(err.message || "Failed to load cafes");
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lon: longitude });
        setMapCenter([latitude, longitude]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "User-Agent": "cafe-finder-app" } }
          );
          const data = await res.json();
          const placeName =
            data.address?.suburb ||
            data.address?.city ||
            data.address?.town ||
            "Your Location";
          setUserLocationName(placeName);
          localStorage.setItem("userLocation", placeName);

          const cafeRes = await fetch(
            `${API}/api/cafes/coordinates?lat=${latitude}&lon=${longitude}`
          );
          if (cafeRes.ok) {
            const cafeData = await cafeRes.json();
            setCafes(
              Array.isArray(cafeData.cafes)
                ? cafeData.cafes
                : Array.isArray(cafeData)
                ? cafeData
                : []
            );
          }
        } catch {
          fetchCafes();
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not access your location. Please check browser permissions.");
        setLoading(false);
      }
    );
  };

  const handleLocationChange = () => {
    const loc = prompt("Enter city or neighborhood:", userLocationName);
    if (loc?.trim()) {
      setUserLocationName(loc.trim());
      localStorage.setItem("userLocation", loc.trim());
    }
  };

  const toggleAmenity = (id) => {
    setActiveAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Filter cafes based on category, search, and amenities
  const filteredCafes = useMemo(() => {
    if (!Array.isArray(cafes)) return [];
    return cafes.filter((cafe) => {
      if (!cafe) return false;
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = cafe.name?.toLowerCase().includes(q);
        const matchesCuisine = cafe.cuisine?.toLowerCase().includes(q);
        const matchesAddress = cafe.address?.toLowerCase().includes(q);
        const matchesTags = cafe.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCuisine && !matchesAddress && !matchesTags) {
          return false;
        }
      }

      // 2. Category
      if (activeCategory !== "all") {
        const cat = activeCategory.toLowerCase();
        const matchesCat =
          cafe.cuisine?.toLowerCase().includes(cat) ||
          cafe.name?.toLowerCase().includes(cat) ||
          cafe.tags?.some((t) => t.toLowerCase().includes(cat));
        if (!matchesCat) return false;
      }

      // 3. Amenities
      if (activeAmenities.includes("wifi") && !cafe.wifi) return false;
      if (activeAmenities.includes("outdoor") && !cafe.outdoor) return false;
      if (
        activeAmenities.includes("takeaway") &&
        !cafe.tags?.includes("Takeaway")
      ) {
        return false;
      }

      return true;
    });
  }, [cafes, search, activeCategory, activeAmenities]);

  const handleSelectCafe = (cafe) => {
    setSelectedCafe(cafe);
    if (!cafe?._id) return;
    const cardElement = document.getElementById(`carousel-cafe-${cafe._id}`);
    if (cardElement && carouselRef.current) {
      cardElement.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-24 md:pb-8 flex flex-col">
      <div className="h-16" />

      {/* ── Top Control Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Browsing around <strong className="text-white">{userLocationName}</strong></span>
              <button
                onClick={handleLocationChange}
                className="text-primary text-xs hover:underline"
              >
                Change
              </button>
              <button
                onClick={handleUseMyLocation}
                className="flex items-center gap-1 text-primary text-xs hover:underline border-l border-dark-border pl-2"
              >
                <Navigation className="w-3 h-3" /> Near Me
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
              <span>Interactive Cafe Map</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                OpenStreetMap
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm font-medium hover:border-primary/40 text-gray-300 hover:text-white transition-all shadow-sm"
            >
              <List className="w-4 h-4 text-primary" />
              <span>List View</span>
            </Link>
          </div>
        </div>

        {/* ── Search + Filter Chips ── */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cafes on map..."
              className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          {/* Category Chips (Dynamically Generated from Real Cafes) */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar w-full sm:w-auto py-1">
            {dynamicCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all cursor-pointer ${
                  activeCategory === c.id
                    ? "bg-primary text-black border-primary font-semibold"
                    : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Amenity Badges */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar w-full sm:w-auto py-1">
            <button
              onClick={() => toggleAmenity("wifi")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                activeAmenities.includes("wifi")
                  ? "bg-primary text-black border-primary font-semibold"
                  : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" /> WiFi
            </button>
            <button
              onClick={() => toggleAmenity("outdoor")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                activeAmenities.includes("outdoor")
                  ? "bg-primary text-black border-primary font-semibold"
                  : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Outdoor
            </button>
            <button
              onClick={() => toggleAmenity("takeaway")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                activeAmenities.includes("takeaway")
                  ? "bg-primary text-black border-primary font-semibold"
                  : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" /> Takeaway
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Map View Container (Always Mounted & Stable Height) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col relative min-h-[500px]">
        <div 
          className="relative w-full flex-1 h-[65vh] min-h-[480px] rounded-3xl overflow-hidden border border-dark-border shadow-2xl"
          style={{ minHeight: "480px" }}
        >
          {/* Leaflet Map is always mounted and responsive */}
          <MapComponent
            cafes={filteredCafes}
            selectedCafe={selectedCafe}
            onSelectCafe={handleSelectCafe}
            center={mapCenter}
            zoom={14}
            userCoords={userCoords}
            className="w-full h-full"
          />

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
              >
                <div className="glass px-6 py-4 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm font-medium text-white">Loading cafes from OpenStreetMap...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner (Non-blocking) */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-4 right-4 sm:left-auto sm:right-16 z-30 max-w-md bg-red-950/90 border border-red-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-200">{error}</span>
                </div>
                <button
                  onClick={fetchCafes}
                  className="px-2.5 py-1 bg-red-500 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-red-600 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Map Stats Badge */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="glass px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-200">
                {filteredCafes.length} cafe{filteredCafes.length !== 1 ? "s" : ""} on map
              </span>
            </div>
          </div>

          {/* Recenter / Locate Me Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleUseMyLocation}
              title="Center on my location"
              className="w-10 h-10 rounded-xl bg-dark-card/90 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-lg cursor-pointer"
            >
              <Compass className="w-5 h-5" />
            </button>
          </div>

          {/* ── Bottom Carousel of Cafe Cards ── */}
          {filteredCafes.length > 0 ? (
            <div
              ref={carouselRef}
              className="absolute bottom-4 left-4 right-4 z-20 flex gap-3 overflow-x-auto hide-scrollbar py-1"
            >
              {filteredCafes.map((cafe) => {
                const isSelected = selectedCafe?._id === cafe._id;
                const photo =
                  cafe.photo ||
                  cafe.photos?.[0] ||
                  "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg";
                const rating = cafe.rating ? Number(cafe.rating).toFixed(1) : "4.5";
                const reviews = cafe.reviewCount || cafe.reviews?.length || 120;

                return (
                  <motion.div
                    id={`carousel-cafe-${cafe._id}`}
                    key={cafe._id || cafe.osmId}
                    onClick={() => handleSelectCafe(cafe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`cursor-pointer shrink-0 w-64 p-3 rounded-2xl glass transition-all ${
                      isSelected
                        ? "border-primary bg-dark-card shadow-2xl ring-2 ring-primary/40"
                        : "border-white/10 bg-dark-card/85 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <img
                        src={photo}
                        alt={cafe.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                        onError={(e) => {
                          e.target.src =
                            "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {cafe.name}
                        </h4>
                        <p className="text-xs text-primary font-medium truncate">
                          {cafe.cuisine || "Cafe"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{rating}</span>
                          <span className="text-gray-400 text-[10px]">
                            ({reviews})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 truncate max-w-[150px]">
                        {cafe.address || userLocationName}
                      </span>
                      <Link
                        to={`/cafe/${cafe._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                      >
                        Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : !loading && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              <div className="glass px-5 py-2.5 rounded-2xl border border-white/10 text-center shadow-xl">
                <p className="text-xs text-gray-300">
                  No cafes found in this view. Try adjusting filters or searching another area.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
