import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Clock, Sparkles, Coffee, X, Smartphone, CheckCircle,
  MapPin, ShieldAlert, LogIn, Copy, Check, QrCode, Map as MapIcon
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../config";

const TIMER_DURATION = 900; // 15 minutes (practical counter ordering window)

/* ==============================
   Barista Voucher Modal
   Practical 15-minute redemption window with scannable voucher and code
============================== */
function BaristaModal({ deal, redemptionInfo, onClose }) {
  const expiresAt = new Date(redemptionInfo.expiresAt);
  const calcRemaining = () => Math.max(Math.floor((expiresAt - new Date()) / 1000), 0);

  const [seconds, setSeconds] = useState(calcRemaining);
  const [expired, setExpired] = useState(() => calcRemaining() <= 0);
  const [copied, setCopied] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (expired) return;
    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setExpired(true);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [expired]);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(deal.code || "CAFEFINDER");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const progress = Math.min(Math.max(seconds / TIMER_DURATION, 0), 1);
  const borderColor = seconds > 300 ? "#4ade80" : seconds > 90 ? "#facc15" : "#f87171";
  const voucherPin = redemptionInfo.verificationPin || `${deal.code || "CF"}-7489`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl overflow-hidden relative bg-dark-card border border-dark-border shadow-2xl"
        style={{
          boxShadow: `0 0 35px ${borderColor}30`,
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-800 relative overflow-hidden">
          <motion.div
            className="h-full absolute left-0 top-0"
            style={{ backgroundColor: borderColor }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5" /> Digital Barista Pass
          </div>
          <h2 className="text-xl font-bold text-white">{deal.title}</h2>
          <p className="text-xs text-gray-400 mt-1">{deal.cafeName}</p>
        </div>

        {/* Voucher Code Box with 1-click Copy */}
        <div className="mx-6 my-4 p-4 rounded-2xl bg-dark-surface border border-primary/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Voucher Code</span>
            <span className="text-xl font-mono font-extrabold text-primary tracking-wider">{deal.code || "BOGO50"}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary-light transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Scannable Barcode / QR Visual */}
        <div className="mx-6 p-4 rounded-2xl bg-white flex flex-col items-center justify-center text-black">
          {/* Simulated clean barcode pattern */}
          <div className="flex items-center justify-center gap-1 w-full h-10 mb-1.5 px-4 overflow-hidden">
            {[4, 2, 6, 1, 3, 5, 2, 7, 3, 1, 4, 6, 2, 3, 5, 1, 6, 3, 2, 4, 6, 2, 5, 1, 3, 6, 2].map((w, idx) => (
              <div key={idx} className="bg-black h-full rounded-sm" style={{ width: `${w * 1.5}px` }} />
            ))}
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-gray-800">
            PIN: {voucherPin}
          </span>
          <span className="text-[10px] text-gray-500">Scan or enter code at checkout</span>
        </div>

        {/* Timer Display */}
        <div className="px-6 py-4 text-center">
          {!expired && !redeemed ? (
            <>
              <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Valid for ordering</p>
              <div
                className="text-4xl font-mono font-bold tabular-nums"
                style={{ color: borderColor }}
              >
                {mins}:{secs}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">15-minute counter activation</p>
            </>
          ) : redeemed ? (
            <div className="py-2 text-emerald-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-1" />
              <p className="font-bold text-sm">Voucher Applied Successfully!</p>
              <p className="text-xs text-gray-400 mt-0.5">Enjoy your coffee & snack</p>
            </div>
          ) : (
            <div className="py-2 text-red-400">
              <p className="font-bold text-sm">Session Expired</p>
              <p className="text-xs text-gray-500 mt-0.5">You can re-claim this deal if uses remain</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-dark-surface/50 border-t border-dark-border flex gap-2">
          <Link
            to="/map"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-dark-border text-xs font-semibold text-gray-300 hover:text-white hover:border-primary/40 flex items-center justify-center gap-1.5 transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5 text-primary" /> Find on Map
          </Link>

          {!redeemed && !expired && (
            <button
              onClick={() => setRedeemed(true)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Mark as Used
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ==============================
   Deal Card
============================== */
function DealCard({ deal, index, userId }) {
  const navigate = useNavigate();
  const [showBarista, setShowBarista] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [redemptionInfo, setRedemptionInfo] = useState(
    // If server already told us this deal was claimed, pre-populate
    deal.claimed ? { claimedAt: deal.claimedAt, expiresAt: deal.expiresAt } : null
  );

  const isExpired = redemptionInfo
    ? new Date() > new Date(redemptionInfo.expiresAt)
    : deal.expired;

  const isClaimed = !!redemptionInfo || deal.claimed;

  const handleClaim = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // If already claimed but not expired, just reopen the modal
    if (isClaimed && !isExpired && redemptionInfo) {
      setShowBarista(true);
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch(`${API}/api/deals/${deal._id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();

      if (data.success) {
        setRedemptionInfo({ claimedAt: data.claimedAt, expiresAt: data.expiresAt });
        setShowBarista(true);
      }
    } catch (e) {
      console.error("Claim error:", e);
    } finally {
      setClaiming(false);
    }
  };

  const buttonState = () => {
    if (!userId) return { label: "Login to Claim", icon: <LogIn className="w-4 h-4" />, style: "bg-dark-surface border border-primary/30 text-primary" };
    if (isClaimed && isExpired) return { label: "Already Redeemed", icon: null, style: "bg-gray-800 text-gray-500 cursor-not-allowed" };
    if (isClaimed && !isExpired) return { label: "Show to Barista", icon: <Smartphone className="w-4 h-4" />, style: "bg-green-500/20 border border-green-500/30 text-green-400" };
    if (claiming) return { label: "Claiming...", icon: <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />, style: "bg-primary text-black opacity-70" };
    return { label: "Show to Barista", icon: <Smartphone className="w-4 h-4" />, style: "bg-primary text-black hover:bg-primary/90" };
  };

  const btn = buttonState();
  const cardDimmed = isClaimed && isExpired;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className={`group overflow-hidden rounded-2xl bg-dark-card border transition-all duration-300 flex flex-col ${
          cardDimmed ? "border-gray-800 opacity-40 grayscale" : "border-dark-border hover:border-primary/30"
        }`}
      >
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <img src={deal.image} alt={deal.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/20 to-transparent" />
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-primary text-black text-sm font-bold shadow-lg">
            {deal.discountLabel || `${deal.discount}% OFF`}
          </div>
          {deal.distanceKm !== undefined && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-xs text-white">{deal.distanceKm} km</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-xs text-primary font-semibold bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full truncate max-w-[170px]">
              {deal.cafeName}
            </span>
            <Link
              to="/map"
              className="text-[11px] font-bold bg-primary text-black hover:bg-primary-light px-2.5 py-1 rounded-full flex items-center gap-1 transition-all shadow-md"
            >
              <MapIcon className="w-3 h-3" /> Map
            </Link>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-primary transition-colors">{deal.title}</h3>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed flex-1">{deal.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Clock className="w-3.5 h-3.5 text-primary/60" />
            <span>Valid until <span className="text-gray-400">{deal.validUntil}</span></span>
            <span className="ml-auto text-gray-600">{deal.maxUses - deal.usedCount} left</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClaim}
            disabled={isClaimed && isExpired}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${btn.style}`}
          >
            {btn.icon}
            {btn.label}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showBarista && redemptionInfo && (
          <BaristaModal deal={deal} redemptionInfo={redemptionInfo} onClose={() => setShowBarista(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ==============================
   Deals Page
============================== */
export default function Deals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => fetchDeals(pos.coords.latitude, pos.coords.longitude),
      () => fetchDeals(19.0760, 72.8777)
    );
  }, [user]);

  const fetchDeals = async (lat, lon) => {
    try {
      const userParam = user?.id ? `&userId=${user.id}` : "";
      const res = await fetch(`${API}/api/deals/nearby?lat=${lat}&lon=${lon}${userParam}`);
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Deals fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: "all", label: "All Deals" },
    { id: "cafe", label: "Cafés" },
    { id: "bakery", label: "Bakeries" },
    { id: "workspace", label: "Workspaces" },
  ];

  const filtered = deals.filter(d => filter === "all" || d.category === filter);

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Deals & Offers</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {user ? `Logged in as ${user.name} · deals track your account` : "Login to claim deals"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-primary/25 via-primary/10 to-transparent border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Coffee className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-semibold uppercase tracking-wider">How it works</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">📱 Show, Don't Type</h2>
            <p className="text-gray-400 text-sm">Claim a deal → show the screen to the barista. 3-min timer, one use per account.</p>
          </div>
        </motion.div>

        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-1">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.id ? "bg-primary text-black" : "bg-dark-card border border-dark-border text-gray-400 hover:border-primary/40 hover:text-white"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-600 mb-5">
          {loading ? "Finding deals near you..." : `${filtered.length} deal${filtered.length !== 1 ? "s" : ""} available`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-dark-card border border-dark-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Coffee className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No deals found nearby</p>
            <p className="text-gray-600 text-sm mt-1">Try a different filter or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((deal, i) => (
              <DealCard key={deal._id} deal={deal} index={i} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}