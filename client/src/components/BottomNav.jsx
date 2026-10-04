import { Link, useLocation } from "react-router-dom";
import { Home, Heart, Tag, User, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { name: "Home", path: "/", icon: Home },
  { name: "Map", path: "/map", icon: MapIcon },
  { name: "Favorites", path: "/favorites", icon: Heart },
  { name: "Deals", path: "/deals", icon: Tag },
  { name: "Profile", path: "/profile", icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  // Don't show on auth pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.name}
              to={tab.path}
              className="relative flex flex-col items-center gap-0.5 flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
