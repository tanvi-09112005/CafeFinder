import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, Loader2, Navigation } from "lucide-react";
import SearchBar from "../components/SearchBar";
import CategoryPills from "../components/CategoryPills";
import CafeCard from "../components/CafeCard";
import { useAuth } from "../contexts/AuthContext";
import SectionHeader from "../components/SectionHeader";

const categories = [
  { id: "all", name: "All" },
  { id: "coffee", name: "Coffee" },
  { id: "bakery", name: "Bakery" },
  { id: "brunch", name: "Brunch" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('userLocation');
    return saved || "New York";
  });
  const [useMyLocation, setUseMyLocation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (useMyLocation) {
      getUserLocation();
    } else {
      fetchCafes();
    }
  }, [userLocation, useMyLocation]);

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
              { headers: { 'User-Agent': 'cafe-finder-app' } }
            );
            const data = await response.json();
            const locationName = data.address.city || data.address.town || data.address.suburb || "Your Location";
            
            setUserLocation(locationName);
            localStorage.setItem('userLocation', locationName);
            
            fetchCafesWithCoords(position.coords.latitude, position.coords.longitude);
          } catch (error) {
            console.error("Error getting location name:", error);
            fetchCafesWithCoords(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Could not get your location. Please enter manually.");
          setLoading(false);
          setUseMyLocation(false);
        }
      );
    } else {
      setError("Geolocation not supported by your browser");
      setLoading(false);
      setUseMyLocation(false);
    }
  };

  const fetchCafesWithCoords = async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:5000/api/cafes/coordinates?lat=${lat}&lon=${lon}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch cafes");
      }

      const data = await response.json();
      console.log(`📍 Received data from coordinates endpoint:`, data);
      
      // Check if data has cafes property (your API structure)
      if (data && Array.isArray(data.cafes)) {
        setCafes(data.cafes);
      } else if (Array.isArray(data)) {
        setCafes(data);
      } else {
        setCafes([]);
        console.warn("Unexpected API response:", data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching cafes:", err);
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCafes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching cafes for location: ${userLocation}`);
      const response = await fetch(
        `http://localhost:5000/api/cafes?location=${encodeURIComponent(userLocation)}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch cafes");
      }

      const data = await response.json();
      console.log(`✅ Received data from server:`, data);
      
      // Check if data has cafes property (your API structure)
      if (data && Array.isArray(data.cafes)) {
        setCafes(data.cafes);
      } else if (Array.isArray(data)) {
        setCafes(data);
      } else {
        setCafes([]);
        console.warn("Unexpected API response:", data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching cafes:", err);
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = () => {
    const newLocation = prompt("Enter location:", userLocation);
    if (newLocation && newLocation.trim()) {
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', newLocation);
      setUseMyLocation(false);
    }
  };

  const handleUseMyLocation = () => {
    setUseMyLocation(true);
    getUserLocation();
  };

  // Filter cafes based on search
  const filtered = useMemo(() => {
    const cafesArray = Array.isArray(cafes) ? cafes : [];
    
    if (!search.trim()) {
      return cafesArray;
    }
    
    const q = search.toLowerCase();
    return cafesArray.filter((c) => {
      const nameMatch = c?.name?.toLowerCase().includes(q) || false;
      const categoryMatch = c?.cuisine?.toLowerCase().includes(q) || false;
      const tagsMatch = c?.tags?.some((t) => t?.toLowerCase().includes(q)) || false;
      
      return nameMatch || categoryMatch || tagsMatch;
    });
  }, [search, cafes]);

  // Add random ratings for display
  const cafesWithRatings = useMemo(() => {
    return filtered.map(cafe => ({
      ...cafe,
      displayRating: cafe.rating || (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
      displayReviews: cafe.reviewCount || Math.floor(Math.random() * 200) + 50
    }));
  }, [filtered]);

  // Popular cafes (first 4)
  const popularCafes = useMemo(() => {
    return cafesWithRatings.slice(0, 4);
  }, [cafesWithRatings]);

  // Sort by distance (if available)
  const nearbyCafes = useMemo(() => {
    return [...cafesWithRatings].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
  }, [cafesWithRatings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Finding amazing cafes near you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-4 mx-auto">
            <span className="text-4xl">☕</span>
          </div>
          <p className="text-gray-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchCafes}
            className="px-6 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary-light transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MapPin className="w-4 h-4" />
            <span>{userLocation}</span>
            <button
              onClick={handleLocationChange}
              className="text-primary text-xs hover:underline ml-1"
            >
              Change
            </button>
            <button
              onClick={handleUseMyLocation}
              className="flex items-center gap-1 text-primary text-xs hover:underline ml-2 border-l border-dark-border pl-2"
            >
              <Navigation className="w-3 h-3" />
              Use My Location
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Hello, <span className="text-primary">{user?.name?.split(' ')[0] || 'Coffee Lover'}!</span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Found {cafesWithRatings.length} cafes near you
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <SearchBar value={search} onChange={setSearch} />
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Categories
          </h3>
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </motion.div>

        {/* If search active, show results */}
        {search.trim() ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SectionHeader title={`Results (${cafesWithRatings.length})`} />
            {cafesWithRatings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-4">
                  <span className="text-3xl">☕</span>
                </div>
                <p className="text-gray-500 text-sm">
                  No cafes found. Try another search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cafesWithRatings.map((cafe, i) => (
                  <CafeCard 
                    key={cafe?._id || i} 
                    cafe={{
                      ...cafe,
                      rating: cafe.displayRating,
                      reviewCount: cafe.displayReviews
                    }} 
                    index={i} 
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {/* Popular Cafes */}
            {popularCafes.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-10"
              >
                <SectionHeader title="Popular Cafes" />

                <div className="flex gap-4 overflow-x-auto hide-scrollbar md:hidden pb-2">
                  {popularCafes.map((cafe, i) => (
                    <div key={cafe?._id || i} className="min-w-[220px] max-w-[220px]">
                      <CafeCard 
                        cafe={{
                          ...cafe,
                          rating: cafe.displayRating,
                          reviewCount: cafe.displayReviews
                        }} 
                        index={i} 
                        variant="compact" 
                      />
                    </div>
                  ))}
                </div>

                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {popularCafes.map((cafe, i) => (
                    <CafeCard 
                      key={cafe?._id || i} 
                      cafe={{
                        ...cafe,
                        rating: cafe.displayRating,
                        reviewCount: cafe.displayReviews
                      }} 
                      index={i} 
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Near You - Show more cafes! */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-10"
            >
              <SectionHeader title={`All Cafes Near You (${nearbyCafes.length})`} />
              
              {/* Show ALL cafes in a grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {nearbyCafes.map((cafe, i) => (
                  <CafeCard 
                    key={cafe?._id || i} 
                    cafe={{
                      ...cafe,
                      rating: cafe.displayRating,
                      reviewCount: cafe.displayReviews
                    }} 
                    index={i} 
                  />
                ))}
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}