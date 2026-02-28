import { motion } from "framer-motion";

export default function CategoryPills({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cat.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isActive
                ? "bg-primary text-black pill-glow"
                : "bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-gray-600"
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
