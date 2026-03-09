import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Settings, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, MapPin, Star, Heart, Camera,
  Pencil, Check, X, Coffee
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../contexts/FavoritesContext";

const API = "http://localhost:5000";

const menuItems = [
  { icon: Bell,        label: "Notifications",     desc: "Push & email preferences" },
  { icon: Shield,      label: "Privacy & Security", desc: "Account protection" },
  { icon: Coffee,      label: "My Reviews",         desc: "Cafes you've reviewed" },
  { icon: HelpCircle,  label: "Help & Support",     desc: "FAQs and contact us" },
  { icon: Settings,    label: "App Settings",       desc: "Theme, language, etc." },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();
  const { favorites } = useFavorites();
  const fileInputRef = useRef(null);

  const [editing, setEditing]     = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const getInitials = (name = "") =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result); // base64
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) { setError("Name can't be empty"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim(), avatar: avatarPreview })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      // Sync updated user back into AuthContext + localStorage
      const updated = { ...user, name: data.user.name, avatar: data.user.avatar };
      localStorage.setItem("user", JSON.stringify(updated));
      // Re-trigger auth state by calling a lightweight state setter
      window.dispatchEvent(new Event("user-updated"));
      location.reload(); // simplest way to re-hydrate AuthContext from localStorage
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setNameInput(user?.name || "");
    setAvatarPreview(user?.avatar || "");
    setError("");
    setEditing(false);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const stats = [
    { label: "Visits",    value: user?.visits    || 0, icon: MapPin },
    { label: "Reviews",   value: user?.reviews   || 0, icon: Star   },
    { label: "Favorites", value: favorites.length,      icon: Heart  },
  ];

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">

        {/* ── Profile card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-5">

            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 overflow-hidden flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-primary">{getInitials(user?.name)}</span>
                }
              </div>
              {editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4 text-black" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            {/* Name / email */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="w-full bg-dark-card border border-primary/40 rounded-xl px-3 py-2 text-white text-lg font-semibold focus:outline-none focus:border-primary mb-1"
                      placeholder="Your name"
                      autoFocus
                    />
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                  </motion.div>
                ) : (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h1 className="text-2xl font-bold text-white truncate">{user?.name || "User"}</h1>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-gray-500 text-sm mt-0.5 truncate">{user?.email}</p>
              <p className="text-gray-600 text-xs mt-1">
                Member since {user?.createdAt ? formatDate(user.createdAt) : "—"}
              </p>
            </div>

            {/* Edit / Save / Cancel buttons */}
            <div className="flex gap-2 shrink-0">
              {editing ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-primary text-black text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "Saving…" : "Save"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-gray-400 text-sm"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditing(true)}
                  className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Profile
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-border">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Menu items ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass rounded-3xl overflow-hidden mb-6"
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors ${
                  i !== menuItems.length - 1 ? "border-b border-dark-border" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Logout ── */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </motion.button>
      </div>
    </div>
  );
}