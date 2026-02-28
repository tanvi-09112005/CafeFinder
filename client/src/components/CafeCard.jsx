import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, Heart } from "lucide-react";
import { useState } from "react";

export default function CafeCard({ cafe, index = 0, variant = "default" }) {
  const [liked, setLiked] = useState(false);

  const isCompact = variant === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-2xl bg-dark-card border border-dark-border hover:border-primary/30 transition-all duration-300 ${
        isCompact ? "min-w-[200px] sm:min-w-[240px]" : ""
      }`}
    >
      <Link to={`/cafe/${cafe.id}`}>
        {/* Image */}
        <div className={`relative overflow-hidden ${isCompact ? "h-36" : "h-48"}`}>
          <img
            src={cafe.image}
            alt={cafe.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 gradient-overlay" />

          {/* Price badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-xs font-semibold text-primary">
            {cafe.price}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className={`font-semibold text-white group-hover:text-primary transition-colors truncate ${isCompact ? "text-sm" : "text-base"}`}>
            {cafe.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-medium text-white">{cafe.rating}</span>
            </div>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-xs text-gray-400">{cafe.reviews.toLocaleString()} reviews</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{cafe.distance} Away</span>
          </div>
        </div>
      </Link>

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLiked(!liked);
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            liked ? "text-red-500 fill-red-500" : "text-white"
          }`}
        />
      </button>
    </motion.div>
  );
}
