import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Loader2, Navigation, SlidersHorizontal,
  Wifi, Sun, Star, X, ChevronDown, PackageCheck, Map as MapIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import CategoryPills from "../components/CategoryPills";
import CafeCard from "../components/CafeCard";
import { useAuth } from "../contexts/AuthContext";
import SectionHeader from "../components/SectionHeader";
import { API } from "../config";

const categories = [
  { id: "all",    name: "All" },
  { id: "coffee", name: "Coffee" },
  { id: "bakery", name: "Bakery" },
  { id: "brunch", name: "Brunch" },
];

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating",      label: "Top Rated" },
  { id: "reviews",     label: "Most Reviewed" },
  { id: "price_asc",   label: "Price: Low → High" },
  { id: "price_desc",  label: "Price: High → Low" },
];

// Stable seeded mock values — won't flicker on re-render
function seeded(seed, offset = 0) {
  const x = Math.sin(seed + offset + 1) * 10000;
  return x - Math.floor(x);
}
function getId(cafe, i) {
  return cafe._id
    ? cafe._id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    : i + 1;
}
function mockRating(cafe, i)  { const s = getId(cafe, i); return +(seeded(s) * 1.5 + 3.5).toFixed(1); }
function mockReviews(cafe, i) { const s = getId(cafe, i); return Math.floor(seeded(s, 99) * 280) + 20; }
function mockPrice(cafe, i)   { const s = getId(cafe, i); return Math.floor(seeded(s, 7) * 3) + 1; } // 1–3

export default function Home() {
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cafes, setCafes]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [userLocation, setUserLocation]   = useState(
    () => localStorage.getItem("userLocation") || "Mumbai"
  );
  const [useMyLocation, setUseMyLocation] = useState(false);
  const { user } = useAuth();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy]           = useState("recommended");
  const [minRating, setMinRating]     = useState(0);
  const [priceFilter, setPriceFilter] = useState([]);   // e.g. [1,2]
  const [amenities, setAmenities]     = useState([]);   // "wifi","outdoor","takeaway"
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (useMyLocation) getUserLocation();
    else fetchCafes();
  }, [userLocation, useMyLocation]);

  // ── Fetching ──────────────────────────────────────────────
  const getUserLocation = () => {
    setLoading(true);
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { "User-Agent": "cafe-finder-app" } }
          );
          const d = await r.json();
          const name = d.address.city || d.address.town || d.address.suburb || "Your Location";
          setUserLocation(name);
          localStorage.setItem("userLocation", name);
          fetchCafesWithCoords(pos.coords.latitude, pos.coords.longitude);
        } catch { fetchCafesWithCoords(pos.coords.latitude, pos.coords.longitude); }
      },
      () => { setError("Could not get your location."); setLoading(false); setUseMyLocation(false); }
    );
  };

  const fetchCafesWithCoords = async (lat, lon) => {
    try {
      setLoading(true); setError(null);
      const res  = await fetch(`${API}/api/cafes/coordinates?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setCafes(Array.isArray(data.cafes) ? data.cafes : Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); setCafes([]); }
    finally { setLoading(false); }
  };

  const fetchCafes = async () => {
    try {
      setLoading(true); setError(null);
      const res  = await fetch(`${API}/api/cafes?location=${encodeURIComponent(userLocation)}`);
      const data = await res.json();
      setCafes(Array.isArray(data.cafes) ? data.cafes : Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); setCafes([]); }
    finally { setLoading(false); }
  };

  const handleLocationChange = () => {
    const loc = prompt("Enter location:", userLocation);
    if (loc?.trim()) { setUserLocation(loc.trim()); localStorage.setItem("userLocation", loc.trim()); setUseMyLocation(false); }
  };

  // ── Stable enriched data ──────────────────────────────────
  const enriched = useMemo(() => cafes.map((cafe, i) => ({
    ...cafe,
    displayRating:  cafe.rating      || mockRating(cafe, i),
    displayReviews: cafe.reviewCount || mockReviews(cafe, i),
    priceLevel:     cafe.priceLevel  || mockPrice(cafe, i),
  })), [cafes]);

  // ── Filter + search + sort pipeline ──────────────────────
  const finalCafes = useMemo(() => {
    let list = [...enriched];

    // 1. Text search — name, cuisine, address, tags, description
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.cuisine?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // 2. Category pill
    if (activeCategory !== "all") {
      list = list.filter(c =>
        c.cuisine?.toLowerCase().includes(activeCategory) ||
        c.name?.toLowerCase().includes(activeCategory) ||
        c.tags?.some(t => t.toLowerCase().includes(activeCategory))
      );
    }

    // 3. Min rating
    if (minRating > 0) list = list.filter(c => c.displayRating >= minRating);

    // 4. Price
    if (priceFilter.length > 0) list = list.filter(c => priceFilter.includes(c.priceLevel));

    // 5. Amenities
    if (amenities.includes("wifi"))     list = list.filter(c => c.wifi);
    if (amenities.includes("outdoor"))  list = list.filter(c => c.outdoor);
    if (amenities.includes("takeaway")) list = list.filter(c => c.tags?.includes("Takeaway"));

    // 6. Sort
    switch (sortBy) {
      case "rating":     list.sort((a, b) => b.displayRating  - a.displayRating);  break;
      case "reviews":    list.sort((a, b) => b.displayReviews - a.displayReviews); break;
      case "price_asc":  list.sort((a, b) => a.priceLevel - b.priceLevel); break;
      case "price_desc": list.sort((a, b) => b.priceLevel - a.priceLevel); break;
      default: break;
    }

    return list;
  }, [enriched, search, activeCategory, minRating, priceFilter, amenities, sortBy]);

  const popularCafes = useMemo(() =>
    [...enriched].sort((a, b) => b.displayRating - a.displayRating).slice(0, 4),
  [enriched]);

  // ── Helpers ───────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (minRating > 0) n++;
    if (priceFilter.length > 0) n++;
    n += amenities.length;
    return n;
  }, [minRating, priceFilter, amenities]);

  const clearFilters = () => { setMinRating(0); setPriceFilter([]); setAmenities([]); setSortBy("recommended"); };
  const togglePrice   = (p) => setPriceFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleAmenity = (a) => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const priceLabel    = (n) => "₹".repeat(n);

  const toCard = (cafe) => ({
    ...cafe,
    rating:      cafe.displayRating,
    reviewCount: cafe.displayReviews,
  });

  const isFiltering = search.trim() || activeFilterCount > 0 || activeCategory !== "all";

  // ── Loading / error ───────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Finding amazing cafes near you...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-4 mx-auto">
          <span className="text-4xl">☕</span>
        </div>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={fetchCafes} className="px-6 py-2 bg-primary text-black rounded-lg font-medium">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ── Greeting ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1 flex-wrap">
                <MapPin className="w-4 h-4 shrink-0 text-primary" />
                <span>{userLocation}</span>
                <button onClick={handleLocationChange} className="text-primary text-xs hover:underline">Change</button>
                <button
                  onClick={() => { setUseMyLocation(true); getUserLocation(); }}
                  className="flex items-center gap-1 text-primary text-xs hover:underline border-l border-dark-border pl-2"
                >
                  <Navigation className="w-3 h-3" /> Use My Location
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                Hello, <span className="text-primary">{user?.name?.split(" ")[0] || "Coffee Lover"}!</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {isFiltering ? `${finalCafes.length} result${finalCafes.length !== 1 ? "s" : ""}` : `${enriched.length} cafes near you`}
              </p>
            </div>

            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black transition-all text-sm font-semibold self-start sm:self-auto shadow-sm"
            >
              <MapIcon className="w-4 h-4" />
              <span>Explore on Map</span>
            </Link>
          </div>
        </motion.div>

        {/* ── Search + Filter + Sort row ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1"><SearchBar value={search} onChange={setSearch} /></div>

            {/* Map view button */}
            <Link
              to="/map"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-3 rounded-2xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all shrink-0 font-medium text-sm"
              title="Open Map View"
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </Link>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all shrink-0 font-medium text-sm
                ${showFilters || activeFilterCount > 0
                  ? "bg-primary text-black border-primary"
                  : "bg-dark-card border-dark-border text-gray-300 hover:border-primary/40"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
                  ${showFilters ? "bg-black text-primary" : "bg-black/20 text-black"}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="relative shrink-0" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu(v => !v)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-sm font-medium
                  ${sortBy !== "recommended" ? "border-primary/40 text-primary bg-primary/10" : "border-dark-border bg-dark-card text-gray-300 hover:border-primary/40"}`}
              >
                <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl z-50"
                  >
                    {SORT_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2
                          ${i !== SORT_OPTIONS.length - 1 ? "border-b border-dark-border" : ""}
                          ${sortBy === opt.id ? "text-primary bg-primary/10 font-medium" : "text-gray-300 hover:bg-white/5"}`}
                      >
                        <span className="w-4">{sortBy === opt.id ? "✓" : ""}</span>
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-5">

                {/* Rating */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Minimum Rating</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 3.5, 4.0, 4.5].map(r => (
                      <button key={r} onClick={() => setMinRating(r)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                          ${minRating === r ? "bg-primary text-black border-primary" : "border-dark-border text-gray-400 hover:border-primary/40"}`}
                      >
                        {r === 0 ? "Any" : <><Star className="w-3.5 h-3.5 fill-current" />{r}+</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Range</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(p => (
                      <button key={p} onClick={() => togglePrice(p)}
                        className={`px-5 py-1.5 rounded-xl text-sm font-medium border transition-all
                          ${priceFilter.includes(p) ? "bg-primary text-black border-primary" : "border-dark-border text-gray-400 hover:border-primary/40"}`}
                      >
                        {priceLabel(p)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">₹ = Budget &nbsp;·&nbsp; ₹₹ = Mid-range &nbsp;·&nbsp; ₹₹₹ = Premium</p>
                </div>

                {/* Amenities */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Amenities</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: "wifi",     icon: Wifi,         label: "Wi-Fi" },
                      { id: "outdoor",  icon: Sun,          label: "Outdoor Seating" },
                      { id: "takeaway", icon: PackageCheck,  label: "Takeaway" },
                    ].map(({ id, icon: Icon, label }) => (
                      <button key={id} onClick={() => toggleAmenity(id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                          ${amenities.includes(id) ? "bg-primary text-black border-primary" : "border-dark-border text-gray-400 hover:border-primary/40"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1.5 text-red-400 text-sm hover:text-red-300 transition-colors pt-1">
                    <X className="w-4 h-4" /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active filter chips (shown when panel is closed) ── */}
        <AnimatePresence>
          {activeFilterCount > 0 && !showFilters && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 flex-wrap mb-5">
              {minRating > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium">
                  <Star className="w-3 h-3 fill-current" />{minRating}+ stars
                  <button onClick={() => setMinRating(0)} className="ml-1"><X className="w-3 h-3" /></button>
                </span>
              )}
              {priceFilter.map(p => (
                <span key={p} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium">
                  {priceLabel(p)}
                  <button onClick={() => togglePrice(p)} className="ml-1"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {amenities.map(a => (
                <span key={a} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium capitalize">
                  {a}<button onClick={() => toggleAmenity(a)} className="ml-1"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Categories ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="mb-8">
          <CategoryPills categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
        </motion.div>

        {/* ── Results or default sections ── */}
        {isFiltering ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SectionHeader title={`Results (${finalCafes.length})`} />
            {finalCafes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-4">
                  <span className="text-3xl">☕</span>
                </div>
                <p className="text-white font-medium mb-1">No cafes match your filters</p>
                <p className="text-gray-500 text-sm mb-4">Try relaxing some filters or a different search</p>
                <button onClick={clearFilters} className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {finalCafes.map((cafe, i) => (
                  <CafeCard key={cafe?._id || i} cafe={toCard(cafe)} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {/* Popular */}
            {popularCafes.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-10">
                <SectionHeader title="Popular Cafes" />
                <div className="flex gap-4 overflow-x-auto hide-scrollbar md:hidden pb-2">
                  {popularCafes.map((cafe, i) => (
                    <div key={cafe?._id || i} className="min-w-[220px] max-w-[220px]">
                      <CafeCard cafe={toCard(cafe)} index={i} variant="compact" />
                    </div>
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {popularCafes.map((cafe, i) => <CafeCard key={cafe?._id || i} cafe={toCard(cafe)} index={i} />)}
                </div>
              </motion.section>
            )}

            {/* All nearby */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mb-10">
              <SectionHeader title={`All Cafes Near You (${enriched.length})`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {enriched.map((cafe, i) => <CafeCard key={cafe?._id || i} cafe={toCard(cafe)} index={i} />)}
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}