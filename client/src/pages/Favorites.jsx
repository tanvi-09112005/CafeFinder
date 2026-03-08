import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import CafeCard from "../components/CafeCard";
import { useFavorites } from "../contexts/FavoritesContext";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Favorites</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {favorites.length} cafe{favorites.length !== 1 ? "s" : ""} saved
          </p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-24 h-24 rounded-full bg-dark-card flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              Start exploring cafes and tap the heart icon to save your favorites here.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {favorites.map((cafe, i) => (
                <motion.div
                  key={cafe._id}
                  layout
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                  className="relative group"
                >
                  <CafeCard cafe={cafe} index={i} />
                  <button
                    onClick={() => toggleFavorite(cafe)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}