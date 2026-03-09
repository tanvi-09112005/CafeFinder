import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  User,
  Settings,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  MapPin,
  Star,
  Heart,
  Camera,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const menuItems = [
  { icon: User, label: "Edit Profile", desc: "Update your personal info" },
  { icon: MapPin, label: "Saved Addresses", desc: "Manage delivery locations" },
  { icon: CreditCard, label: "Payment Methods", desc: "Cards and wallets" },
  { icon: Bell, label: "Notifications", desc: "Push & email preferences" },
  { icon: Shield, label: "Privacy & Security", desc: "Account protection" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQs and contact us" },
  { icon: Settings, label: "App Settings", desc: "Theme, language, etc." },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://localhost:5000/api/favorites/${user.id}`)
        .then(res => res.json())
        .then(data => setFavoritesCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setFavoritesCount(0));
    }
  }, [user]);

  const stats = [
    { label: "Visits", value: user?.visits || 0, icon: MapPin },
    { label: "Reviews", value: user?.reviews || 0, icon: Star },
    { label: "Favorites", value: favoritesCount, icon: Heart },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-2 border-primary/30">
                {user ? getInitials(user.name) : 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user?.name || 'User'}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {user?.email || 'user@example.com'}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Member since {user?.createdAt ? formatDate(user.createdAt) : 'Jan 2025'}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Edit Profile
            </motion.button>
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

        {/* Menu items */}
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

        {/* Logout */}
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