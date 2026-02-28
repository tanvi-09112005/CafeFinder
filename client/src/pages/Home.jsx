import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, TrendingUp } from "lucide-react";
import SearchBar from "../components/SearchBar";
import CategoryPills from "../components/CategoryPills";
import CafeCard from "../components/CafeCard";
import SectionHeader from "../components/SectionHeader";
import { cafes, categories } from "../data/cafes";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    let result = cafes;
    if (activeCategory !== "all") {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory]);

  const popularCafes = cafes.filter((c) => c.popular);
  const nearbyCafes = [...cafes].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      {/* Spacer for fixed navbar */}
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
            <span>Downtown, New York</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Hello, <span className="text-primary">John!</span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Find the best cafes near you
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
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Categories</h3>
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </motion.div>

        {/* If search or filter active, show results */}
        {(search.trim() || activeCategory !== "all") ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SectionHeader title={`Results (${filtered.length})`} />
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-4">
                  <span className="text-3xl">☕</span>
                </div>
                <p className="text-gray-500 text-sm">No cafes found. Try another search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((cafe, i) => (
                  <CafeCard key={cafe.id} cafe={cafe} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {/* Popular Cafes — Horizontal scroll on mobile, grid on desktop */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <SectionHeader title="Popular Cafes" linkTo="/popular" linkText="See All" />

              {/* Mobile horizontal scroll */}
              <div className="flex gap-4 overflow-x-auto hide-scrollbar md:hidden pb-2">
                {popularCafes.map((cafe, i) => (
                  <div key={cafe.id} className="min-w-[220px] max-w-[220px]">
                    <CafeCard cafe={cafe} index={i} variant="compact" />
                  </div>
                ))}
              </div>

              {/* Desktop grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {popularCafes.map((cafe, i) => (
                  <CafeCard key={cafe.id} cafe={cafe} index={i} />
                ))}
              </div>
            </motion.section>

            {/* Near You */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-10"
            >
              <SectionHeader
                title="Near You"
                linkTo="/nearby"
                linkText="View Map"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {nearbyCafes.slice(0, 4).map((cafe, i) => (
                  <CafeCard key={cafe.id} cafe={cafe} index={i} />
                ))}
              </div>
            </motion.section>

            {/* Trending */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Trending This Week</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cafes.slice(0, 3).map((cafe, i) => (
                  <CafeCard key={cafe.id} cafe={cafe} index={i} />
                ))}
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}
