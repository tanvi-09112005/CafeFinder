import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Map as MapIcon,
  Send,
  MessageSquarePlus,
  Check,
  ExternalLink,
  Plus,
  UploadCloud,
  Camera,
  Utensils,
  X,
  Sparkles,
  Maximize2,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { API } from "../config";
import MapComponent from "../components/MapComponent";
import { useAuth } from "../contexts/AuthContext";

export default function CafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [callStatus, setCallStatus] = useState({ show: false, message: '' });

  // Crowdsourced Menu & Photo state
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuModalTab, setMenuModalTab] = useState("photo"); // "photo" | "dish"
  const [newDish, setNewDish] = useState({
    name: "",
    price: "",
    category: "Specialty Coffee",
    description: "",
    image: ""
  });
  const [newMenuPhoto, setNewMenuPhoto] = useState({
    url: "",
    caption: "",
    preview: ""
  });
  const [submittingMenu, setSubmittingMenu] = useState(false);
  const [menuSuccess, setMenuSuccess] = useState("");
  const [selectedMenuPhoto, setSelectedMenuPhoto] = useState(null);

  // Interactive review submission state
  const { user } = useAuth();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleOfficialMenuClick = () => {
    if (cafe?.menuUrl && cafe.menuUrl.startsWith("http")) {
      window.open(cafe.menuUrl, "_blank");
    } else {
      const query = `${cafe?.name || "cafe"} ${cafe?.address && cafe.address !== "Address not available" ? cafe.address : "Mumbai"} menu`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(searchUrl, "_blank");
    }
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewMenuPhoto(prev => ({
        ...prev,
        url: reader.result,
        preview: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setSubmittingMenu(true);
    setMenuSuccess("");
    try {
      let payload = {};
      if (menuModalTab === "photo") {
        if (!newMenuPhoto.url) return;
        payload = {
          type: "photo",
          photo: {
            url: newMenuPhoto.url,
            caption: newMenuPhoto.caption || "Crowdsourced menu photo",
            uploadedBy: user?.name || "Foodie Contributor"
          }
        };
      } else {
        if (!newDish.name || !newDish.price) return;
        payload = {
          type: "dish",
          item: {
            ...newDish,
            price: Number(newDish.price),
            addedBy: user?.name || "Foodie Contributor"
          }
        };
      }

      const res = await fetch(`${API}/api/cafes/${id}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCafe(data.cafe);
        setMenuSuccess(
          menuModalTab === "photo" 
            ? "Menu photo published to community!" 
            : `Added "${newDish.name}" to menu!`
        );
        setTimeout(() => {
          setMenuSuccess("");
          setShowMenuModal(false);
          setNewDish({ name: "", price: "", category: "Specialty Coffee", description: "", image: "" });
          setNewMenuPhoto({ url: "", caption: "", preview: "" });
        }, 1500);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update menu");
      }
    } catch (err) {
      console.error("Error submitting menu contribution:", err);
      alert("Error saving menu item to database");
    } finally {
      setSubmittingMenu(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmittingReview(true);
      const res = await fetch(`${API}/api/cafes/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          userName: user?.name || "Coffee Lover",
          userAvatar: user?.avatar || "",
          rating: newRating,
          text: newComment.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCafe(prev => ({
          ...prev,
          reviews: data.cafe?.reviews || [
            { userName: user?.name || "You", rating: newRating, text: newComment.trim(), date: "Just now" },
            ...(prev.reviews || [])
          ],
          rating: data.cafe?.rating || prev.rating,
          reviewCount: data.cafe?.reviewCount || ((prev.reviewCount || 0) + 1)
        }));
        setNewComment("");
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchCafeDetails();
  }, [id]);

  const fetchCafeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/cafes/${id}`);
      
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
    if (!cafe?.location?.coordinates) return;
    
    const [lon, lat] = cafe.location.coordinates;
    
    // Open free and open-source OpenStreetMap directions
    const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lat},${lon}`;
    window.open(osmUrl, '_blank');
  };

  const handleCallNow = () => {
    if (!cafe?.phone) {
      setCallStatus({ 
        show: true, 
        message: 'No phone number available for this cafe' 
      });
      setTimeout(() => setCallStatus({ show: false, message: '' }), 3000);
      return;
    }

    // Clean the phone number (remove spaces, dashes, etc)
    let phoneNumber = cafe.phone.replace(/[\s\-\(\)]/g, '');
    
    // Add + if it's international format and not already there
    if (phoneNumber.startsWith('+')) {
      // Keep as is
    } else if (phoneNumber.startsWith('00')) {
      // Convert 00 to + (common international prefix)
      phoneNumber = '+' + phoneNumber.substring(2);
    } else if (phoneNumber.length === 10) {
      // Assume Indian number, add +91
      phoneNumber = '+91' + phoneNumber;
    }

    console.log('Calling:', phoneNumber); // Debug log
    
    try {
      window.location.href = `tel:${phoneNumber}`;
      
      // Show success message
      setCallStatus({ 
        show: true, 
        message: `Calling ${cafe.phone}...` 
      });
      setTimeout(() => setCallStatus({ show: false, message: '' }), 2000);
    } catch (err) {
      console.error('Call failed:', err);
      setCallStatus({ 
        show: true, 
        message: 'Could not initiate call' 
      });
      setTimeout(() => setCallStatus({ show: false, message: '' }), 3000);
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

  const mainPhoto = cafe.photos?.[0] || "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg";

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      {/* Call Status Toast */}
      {callStatus.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-dark-card border border-primary/20 text-white px-4 py-2 rounded-xl shadow-lg"
        >
          {callStatus.message}
        </motion.div>
      )}

      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={mainPhoto}
          alt={cafe.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg";
          }}
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
                <p className="text-sm text-white">{cafe.openingHours || "8AM - 8PM"}</p>
              </div>
            </div>
            <div 
              className={`flex items-center gap-3 p-3 rounded-xl bg-dark-surface ${
                cafe.phone && cafe.phone !== "Not available" ? 'cursor-pointer hover:bg-primary/10 transition-colors' : ''
              }`}
              onClick={() => {
                if (cafe.phone && cafe.phone !== "Not available") {
                  handleCallNow();
                }
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-white">
                  {cafe.phone && cafe.phone !== "Not available" ? cafe.phone : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Location Map Preview */}
          {cafe.location?.coordinates && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">Location on OpenStreetMap</span>
                </div>
                <Link
                  to="/map"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Explore in Map View →
                </Link>
              </div>
              <div className="h-56 w-full rounded-2xl overflow-hidden border border-dark-border">
                <MapComponent
                  cafes={[cafe]}
                  selectedCafe={cafe}
                  center={[cafe.location.coordinates[1], cafe.location.coordinates[0]]}
                  zoom={15}
                  autoFit={false}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
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
        {activeTab === "menu" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 space-y-5"
          >
            {/* Menu Header & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-dark-card border border-dark-border">
              <div>
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-white">Menu & Offerings</h3>
                  <span className="text-xs bg-white/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {cafe.menu?.length || 0} items
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Artisanal roasts, bakeries & community crowdsourced picks
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOfficialMenuClick}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
                  title="Open Official Menu or Search online"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <span>Official Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMenuModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary-light transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dish / Photo</span>
                </button>
              </div>
            </div>

            {/* Crowdsourced Menu Photo Gallery */}
            {cafe.menuPhotos && cafe.menuPhotos.length > 0 && (
              <div className="p-4 rounded-2xl bg-dark-card border border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Community Menu Boards ({cafe.menuPhotos.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-500">Tap to expand full screen</span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {cafe.menuPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedMenuPhoto(photo)}
                      className="relative shrink-0 w-36 h-48 rounded-xl overflow-hidden border border-white/10 cursor-pointer group hover:border-primary transition-all"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || "Menu"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 flex flex-col justify-end p-2.5">
                        <span className="text-[11px] font-semibold text-white truncate drop-shadow">
                          {photo.caption || "Menu Board"}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          by {photo.uploadedBy || "Foodie"}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items List */}
            {cafe.menu && cafe.menu.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cafe.menu.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-dark-card border border-dark-border hover:border-primary/30 transition-all group relative overflow-hidden"
                  >
                    {item.isCommunityAdded && (
                      <span className="absolute top-0 right-0 bg-primary/20 text-primary border-b border-l border-primary/30 text-[9px] font-semibold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Community Pick
                      </span>
                    )}
                    <img
                      src={item.image || "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg"}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform shrink-0"
                      onError={(e) => {
                        e.target.src = "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 pr-12">
                        <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold text-sm">
                          ₹{item.price || 180}
                        </span>
                        {item.category && (
                          <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 rounded-2xl bg-dark-card border border-dashed border-dark-border">
                <p className="text-gray-400 text-sm mb-3">No dishes listed yet for this cafe.</p>
                <button
                  type="button"
                  onClick={() => setShowMenuModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Be the first to add a dish or menu photo
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "reviews" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5 mb-8"
          >
            {/* Interactive Write a Review Card */}
            <div className="p-5 rounded-2xl bg-dark-card border border-primary/20 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-white">Share Your Experience</h3>
              </div>
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="text-lg p-0.5 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newRating
                              ? "text-primary fill-primary"
                              : "text-gray-600 hover:text-primary/60"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-primary ml-1">{newRating} / 5</span>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="How was the coffee, seating, wifi, or noise level?"
                  rows={2}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all resize-none"
                  required
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Posting as {user?.name || "Guest"}</span>
                  <button
                    type="submit"
                    disabled={submittingReview || !newComment.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary-light transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : reviewSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Posted!
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Post Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Reviews List */}
            {cafe.reviews && cafe.reviews.length > 0 ? (
              <div className="space-y-4">
                {cafe.reviews.map((review, i) => {
                  const authorName = review.userName || review.author || "Coffee Lover";
                  const initial = authorName[0]?.toUpperCase() || "C";
                  return (
                    <motion.div
                      key={review._id || i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="p-5 rounded-2xl bg-dark-card border border-dark-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {initial}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{authorName}</p>
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
                      <p className="text-sm text-gray-300 leading-relaxed pl-12">
                        {review.text || "Great atmosphere and coffee!"}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6">No reviews yet. Be the first to leave one!</p>
            )}
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
                  alt={`${cafe.name} ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg";
                  }}
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
              className={`flex-1 md:flex-none md:px-8 py-3.5 rounded-2xl glass text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors ${
                !cafe.phone || cafe.phone === "Not available" ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!cafe.phone || cafe.phone === "Not available"}
            >
              <Phone className="w-4 h-4" />
              Call Now
            </motion.button>
          </div>
        </motion.div>

        {/* Community Menu Contribution Modal */}
        <AnimatePresence>
          {showMenuModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-dark-card border border-dark-border rounded-3xl p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      Contribute to Café Menu
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Upload a physical menu photo or add a specific dish/drink
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMenuModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Tabs */}
                <div className="flex gap-2 p-1 bg-dark-surface rounded-xl my-4">
                  <button
                    type="button"
                    onClick={() => setMenuModalTab("photo")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      menuModalTab === "photo"
                        ? "bg-primary text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload Menu Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuModalTab("dish")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      menuModalTab === "dish"
                        ? "bg-primary text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Add a Dish / Drink
                  </button>
                </div>

                {/* Success message banner */}
                {menuSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{menuSuccess}</span>
                  </div>
                )}

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto pr-1">
                  <form onSubmit={handleMenuSubmit} className="space-y-4">
                    {menuModalTab === "photo" ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-300">
                            Menu Photo (Board, Brochure, or Counter List)
                          </label>
                          
                          {/* File Upload Box */}
                          <label className="border-2 border-dashed border-dark-border hover:border-primary/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-dark-surface/50 transition-colors">
                            {newMenuPhoto.preview ? (
                              <div className="relative w-full h-40 rounded-xl overflow-hidden">
                                <img
                                  src={newMenuPhoto.preview}
                                  alt="Menu Preview"
                                  className="w-full h-full object-contain bg-black/40"
                                />
                                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md">
                                  Click to Change
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <UploadCloud className="w-5 h-5" />
                                </div>
                                <p className="text-xs text-white font-medium">Click to select photo from device</p>
                                <p className="text-[10px] text-gray-500">Supports JPG, PNG, WebP (Max 10MB)</p>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoFileChange}
                              className="hidden"
                            />
                          </label>

                          <div className="text-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">or paste image URL</span>
                          </div>
                          <input
                            type="url"
                            value={newMenuPhoto.url && !newMenuPhoto.url.startsWith("data:") ? newMenuPhoto.url : ""}
                            onChange={(e) => {
                              setNewMenuPhoto(prev => ({
                                ...prev,
                                url: e.target.value,
                                preview: e.target.value
                              }));
                            }}
                            placeholder="https://example.com/menu-photo.jpg"
                            className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-300">
                            Caption / Section Name
                          </label>
                          <input
                            type="text"
                            value={newMenuPhoto.caption}
                            onChange={(e) => setNewMenuPhoto(prev => ({ ...prev, caption: e.target.value }))}
                            placeholder="e.g. Main Beverage & Coffee Menu, Desserts Board"
                            className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-300">Dish / Drink Name *</label>
                          <input
                            type="text"
                            required
                            value={newDish.name}
                            onChange={(e) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Spanish Latte, Truffle Scrambled Eggs"
                            className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-300">Price (₹) *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={newDish.price}
                              onChange={(e) => setNewDish(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="e.g. 220"
                              className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-300">Category</label>
                            <select
                              value={newDish.category}
                              onChange={(e) => setNewDish(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                            >
                              <option value="Specialty Coffee">Specialty Coffee</option>
                              <option value="Manual Brews">Manual Brews</option>
                              <option value="Tea & Beverages">Tea & Beverages</option>
                              <option value="Bakery & Desserts">Bakery & Desserts</option>
                              <option value="Gourmet Bites">Gourmet Bites</option>
                              <option value="Breakfast & Brunch">Breakfast & Brunch</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-300">Description / Highlights</label>
                          <input
                            type="text"
                            value={newDish.description}
                            onChange={(e) => setNewDish(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="e.g. Double shot espresso with sweetened condensed milk"
                            className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-300">Photo URL (Optional)</label>
                          <input
                            type="url"
                            value={newDish.image}
                            onChange={(e) => setNewDish(prev => ({ ...prev, image: e.target.value }))}
                            placeholder="https://images.pexels.com/..."
                            className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          />
                        </div>
                      </>
                    )}

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        Posting as {user?.name || "Anonymous Foodie"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMenuModal(false)}
                          className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingMenu || (menuModalTab === "photo" && !newMenuPhoto.url) || (menuModalTab === "dish" && (!newDish.name || !newDish.price))}
                          className="px-5 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-light transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {submittingMenu ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {menuModalTab === "photo" ? "Upload Photo" : "Add Dish"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Fullscreen Photo Lightbox Modal */}
        <AnimatePresence>
          {selectedMenuPhoto && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
              onClick={() => setSelectedMenuPhoto(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-3xl max-h-[90vh] flex flex-col items-center cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedMenuPhoto(null)}
                  className="absolute -top-10 right-0 p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={selectedMenuPhoto.url}
                  alt={selectedMenuPhoto.caption || "Full Menu Board"}
                  className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
                />
                <div className="mt-3 text-center">
                  <p className="text-sm font-semibold text-white">{selectedMenuPhoto.caption || "Menu Photo"}</p>
                  <p className="text-xs text-gray-400">Uploaded by {selectedMenuPhoto.uploadedBy || "Community Contributor"}</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}