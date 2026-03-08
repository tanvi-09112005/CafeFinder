import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, Heart, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export default function CafeCard({ cafe, index = 0, variant = "default" }) {
  const [liked, setLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isCompact = variant === "compact";

  // Provide default values for all properties
  const cafeData = {
    id: cafe?._id || cafe?.id || index,
    name: cafe?.name || "Local Cafe",
    // Use multiple fallback images
    image: !imageError 
      ? (cafe?.photo || cafe?.photos?.[0] || getRandomCafeImage(index))
      : getRandomCafeImage(index),
    price: cafe?.price || "$$",
    rating: cafe?.rating || cafe?.displayRating || (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
    reviews: cafe?.reviewCount || cafe?.reviews?.length || Math.floor(Math.random() * 200) + 50,
    distance: cafe?.distance || "0.5",
    cuisine: cafe?.cuisine || "Coffee"
  };

  // Function to get random cafe images from reliable sources
  function getRandomCafeImage(seed) {
    const images = [
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg", // Coffee shop
      "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg", // Cafe interior
      "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg", // Coffee cup
      "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg", // Espresso
      "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg", // Latte art
      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg", // Bakery
      "https://images.pexels.com/photos/757520/pexels-photo-757520.jpeg", // Coffee beans
      "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg", // Cappuccino
    ];
    
    // Use the seed to pick a consistent image for each cafe
    const imageIndex = (seed || Math.floor(Math.random() * images.length)) % images.length;
    return images[imageIndex];
  }

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
      <Link to={`/cafe/${cafeData.id}`}>
        {/* Image */}
        <div className={`relative overflow-hidden ${isCompact ? "h-36" : "h-48"} bg-dark-surface`}>
          {cafeData.image ? (
            <img
              src={cafeData.image}
              alt={cafeData.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/60 via-transparent to-transparent" />

          {/* Price badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs font-semibold text-primary border border-primary/20">
            {cafeData.price}
          </div>

          {/* Cuisine badge if available */}
          {cafeData.cuisine && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white border border-white/10">
              {cafeData.cuisine}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className={`font-semibold text-white group-hover:text-primary transition-colors truncate ${isCompact ? "text-sm" : "text-base"}`}>
            {cafeData.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-white">{cafeData.rating}</span>
            </div>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-xs text-gray-400">
              {cafeData.reviews > 0 ? cafeData.reviews.toLocaleString() : "0"} reviews
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{cafeData.distance} mi Away</span>
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
        className="absolute top-3 right-12 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
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