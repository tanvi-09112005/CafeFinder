import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Heart,
  Share2,
  Navigation,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function CafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

  useEffect(() => {
    fetchCafeDetails();
  }, [id]);

  const fetchCafeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/cafes/${id}`);
      
      if (!response.ok) {
        throw new Error("Cafe not found");
      }

      const data = await response.json();
      setCafe(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (!cafe) return;
    
    const [lon, lat] = cafe.location.coordinates;
    
    // Open Google Maps in new tab (free to use)
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleCallNow = () => {
    if (cafe?.phone) {
      window.location.href = `tel:${cafe.phone}`;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cafe.name,
          text: `Check out ${cafe.name}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading cafe details...</p>
        </div>
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Cafe not found</p>
          <Link to="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const mainPhoto = cafe.photos?.[0] || "https://images.unsplash.com/photo-1554118811-1e0d58224f24";

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={mainPhoto}
          alt={cafe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />

        {/* Top buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <button 
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  liked ? "text-red-500 fill-red-500" : "text-white"
                }`}
              />
            </button>
          </motion.div>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-20 left-6 px-3 py-1.5 rounded-lg bg-primary/90 text-black text-sm font-bold">
          {cafe.price || "$$"}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {cafe.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span className="font-semibold text-white">{cafe.rating?.toFixed(1) || "4.5"}</span>
              <span className="text-gray-500 text-sm">
                ({cafe.reviewCount?.toLocaleString() || "0"} reviews)
              </span>
            </div>
            {cafe.distance && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" />
                {cafe.distance} Away
              </div>
            )}
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            {cafe.description || "A wonderful cafe in your area."}
          </p>

          {/* Tags */}
          {cafe.tags && cafe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {cafe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-surface">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-white">{cafe.address || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-surface">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hours</p>
                <p className="text-sm text-white">{cafe.hours || "8AM - 8PM"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-surface">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-white">{cafe.phone || "N/A"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-1 p-1 bg-dark-card rounded-2xl">
            {["menu", "reviews", "photos"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-primary text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        {activeTab === "menu" && cafe.menu && cafe.menu.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          >
            {cafe.menu.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-dark-card border border-dark-border hover:border-primary/30 transition-all group"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">{item.name}</h4>
                  <p className="text-primary font-bold mt-1">
                    ${item.price?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "reviews" && cafe.reviews && cafe.reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4 mb-8"
          >
            {cafe.reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="p-5 rounded-2xl bg-dark-card border border-dark-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {review.author?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {review.author || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-500">{review.date || "Recently"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={`w-3.5 h-3.5 ${
                          j < (review.rating || 5)
                            ? "text-primary fill-primary"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {review.text || "Great place!"}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "photos" && cafe.photos && cafe.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
          >
            {cafe.photos.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="aspect-square rounded-2xl overflow-hidden"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Floating action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-auto z-40"
        >
          <div className="max-w-4xl mx-auto flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGetDirections}
              className="flex-1 md:flex-none md:px-8 py-3.5 rounded-2xl bg-primary text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCallNow}
              className="flex-1 md:flex-none md:px-8 py-3.5 rounded-2xl glass text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}