import { motion } from "framer-motion";
import { Tag, Copy, Check, Clock } from "lucide-react";
import { deals } from "../data/cafes";
import { useState } from "react";
import { Link } from "react-router-dom";

function DealCard({ deal, index }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(deal.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group overflow-hidden rounded-2xl bg-dark-card border border-dark-border hover:border-primary/30 transition-all"
    >
      {/* Image */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img
          src={deal.image}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-dark-card to-transparent" />

        {/* Discount badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-primary text-black text-sm font-bold">
          {deal.discount} OFF
        </div>
      </div>

      <div className="p-5">
        <Link
          to={`/cafe/${deal.cafeId}`}
          className="text-xs text-primary font-medium hover:underline"
        >
          {deal.cafeName}
        </Link>
        <h3 className="text-lg font-bold text-white mt-1 mb-2">{deal.title}</h3>
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{deal.description}</p>

        {/* Expiry */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="w-3.5 h-3.5" />
          Valid until {deal.validUntil}
        </div>

        {/* Code */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 rounded-xl bg-dark-surface border border-dashed border-primary/30 text-center">
            <span className="text-primary font-mono font-bold text-sm tracking-wider">
              {deal.code}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyCode}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              copied
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Deals() {
  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Deals & Offers</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Grab exclusive discounts from your favorite cafes
          </p>
        </motion.div>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-3xl bg-linear-to-r from-primary/20 to-primary/5 border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
          <h2 className="text-xl font-bold text-white mb-1 relative z-10">
            🎉 Weekend Special
          </h2>
          <p className="text-gray-400 text-sm relative z-10">
            Use code <span className="text-primary font-bold">WEEKEND25</span> for 25% off at
            any cafe this weekend!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
