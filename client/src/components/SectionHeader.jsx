import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Star, MapPin } from "lucide-react";

export default function SectionHeader({ title, linkTo, linkText = "See All" }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-light transition-colors"
        >
          {linkText}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
