import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  SlidersHorizontal,
  Wifi,
  Sun,
  PackageCheck,
  List,
  Coffee,
  Star,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import { API } from "../config";

const categories = [
  { id: "all", name: "All" },
  { id: "coffee", name: "Coffee" },
  { id: "bakery", name: "Bakery" },
  { id: "brunch", name: "Brunch" },
];

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

  useEffect(() => {
    fetchCafes();
  }, [userLocationName]);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/cafes?location=${encodeURIComponent(userLocationName)}`);
      if (!res.ok) throw new Error("Failed to load cafes");
      const data = await res.json();
      const list = Array.isArray(data.cafes) ? data.cafes : Array.isArray(data) ? data : [];
      setCafes(list);
      if (data.coordinates?.lat && data.coordinates?.lon) {
        setMapCenter([data.coordinates.lat, data.coordinates.lon]);
      } else if (list.length > 0 && list[0].location?.coordinates) {
        setMapCenter([list[0].location.coordinates[1], list[0].location.coordinates[0]]);
      }
    } catch (err) {
      setError(err.message);
      setCafes([]);
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

          // Fetch cafes by coordinates
          const cafeRes = await fetch(
            `${API}/api/cafes/coordinates?lat=${latitude}&lon=${longitude}`
          );
          const cafeData = await cafeRes.json();
          setCafes(
            Array.isArray(cafeData.cafes)
              ? cafeData.cafes
              : Array.isArray(cafeData)
              ? cafeData
              : []
          );
        } catch {
          // Fallback fetch
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
    return cafes.filter((cafe) => {
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
    // Scroll corresponding card in bottom carousel into view
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
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm font-medium hover:border-primary/40 text-gray-300 hover:text-white transition-all"
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
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar w-full sm:w-auto py-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                  activeCategory === c.id
                    ? "bg-primary text-black border-primary"
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
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activeAmenities.includes("wifi")
                  ? "bg-primary text-black border-primary"
                  : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" /> WiFi
            </button>
            <button
              onClick={() => toggleAmenity("outdoor")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activeAmenities.includes("outdoor")
                  ? "bg-primary text-black border-primary"
                  : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Outdoor
            </button>
            <button
              onClick={() => toggleAmenity("takeaway")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activeAmenities.includes("takeaway")
                  ? "bg-primary text-black border-primary"
                  : "bg-dark-card border-dark-border text-gray-400 hover:border-primary/30"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" /> Takeaway
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Map Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col relative min-h-[500px]">
        {loading ? (
          <div className="w-full h-[520px] rounded-3xl bg-dark-card flex flex-col items-center justify-center border border-dark-border">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Rendering OpenStreetMap layer and cafes...</p>
          </div>
        ) : error ? (
          <div className="w-full h-[520px] rounded-3xl bg-dark-card flex flex-col items-center justify-center border border-dark-border p-6 text-center">
            <Coffee className="w-12 h-12 text-primary mb-3 opacity-60" />
            <p className="text-gray-300 font-medium mb-1">Could not load cafe map data</p>
            <p className="text-gray-500 text-xs mb-4">{error}</p>
            <button
              onClick={fetchCafes}
              className="px-5 py-2 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary-light transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative w-full flex-1 h-[60vh] sm:h-[65vh] min-h-[460px] rounded-3xl overflow-hidden">
            <MapComponent
              cafes={filteredCafes}
              selectedCafe={selectedCafe}
              onSelectCafe={handleSelectCafe}
              center={mapCenter}
              zoom={14}
              userCoords={userCoords}
              className="w-full h-full"
            />

            {/* Floating Map Info Overlay */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className="glass px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-gray-200">
                  {filteredCafes.length} cafe{filteredCafes.length !== 1 ? "s" : ""} plotted
                </span>
              </div>
            </div>

            {/* Recenter / Fit All button */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={handleUseMyLocation}
                title="Locate me"
                className="w-9 h-9 rounded-xl bg-dark-card/90 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-lg"
              >
                <Compass className="w-5 h-5" />
              </button>
            </div>

            {/* ── Bottom Carousel of Cafe Cards ── */}
            {filteredCafes.length > 0 && (
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

                  return (
                    <motion.div
                      id={`carousel-cafe-${cafe._id}`}
                      key={cafe._id}
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
                              ({cafe.reviewCount || 120})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[150px]">
                          {cafe.address || "Mumbai"}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
