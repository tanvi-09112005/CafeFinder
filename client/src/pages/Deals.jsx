import { motion } from "framer-motion";
import { Tag, Copy, Check, Clock, Sparkles, Coffee } from "lucide-react";
import { deals } from "../data/cafes";
import { useState } from "react";
import { Link } from "react-router-dom";

const extraDeals = [
  {
    id: 6,
    cafeId: 4,
    cafeName: "Café Botanica",
    title: "Vegan Combo Deal",
    description: "Any vegan item + oat milk latte for just $9. Healthy never tasted so good!",
    discount: "25%",
    validUntil: "Apr 5, 2026",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
    code: "VEGAN25",
  },
  {
    id: 7,
    cafeId: 6,
    cafeName: "CloudWork Café",
    title: "Remote Worker Deal",
    description: "Book a focus pod for 4 hours and get 2 free Americanos",
    discount: "35%",
    validUntil: "Apr 10, 2026",
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&q=80",
    code: "CLOUD35",
  },
  {
    id: 8,
    cafeId: 7,
    cafeName: "Mocha Hideaway",
    title: "Late Night Special",
    description: "After 8 PM: signature mocha + banana bread for just $6",
    discount: "20%",
    validUntil: "Mar 31, 2026",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
    code: "NIGHT20",
  },
];

const allDeals = [...deals, ...extraDeals];

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
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group overflow-hidden rounded-2xl bg-dark-card border border-dark-border hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        <img
          src={deal.image}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/20 to-transparent" />

        {/* Discount badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-primary text-black text-sm font-bold shadow-lg">
          {deal.discount} OFF
        </div>

        {/* Cafe name pill */}
        <div className="absolute bottom-3 left-3">
          <Link
            to={`/cafe/${deal.cafeId}`}
            className="text-xs text-primary font-semibold bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-primary hover:text-black transition-all"
          >
            {deal.cafeName}
          </Link>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-primary transition-colors">
          {deal.title}
        </h3>
        <p className="text-sm text-gray-400 mb-4 leading-relaxed flex-1">{deal.description}</p>

        {/* Expiry */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="w-3.5 h-3.5 text-primary/60" />
          <span>Valid until <span className="text-gray-400">{deal.validUntil}</span></span>
        </div>

        {/* Code copy row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 rounded-xl bg-dark-surface border border-dashed border-primary/40 text-center">
            <span className="text-primary font-mono font-bold text-sm tracking-widest">
              {deal.code}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={copyCode}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
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
  const [filter, setFilter] = useState("all");

  const filters = [
    { id: "all", label: "All Deals" },
    { id: "cafe", label: "Cafés" },
    { id: "bakery", label: "Bakeries" },
    { id: "workspace", label: "Workspaces" },
  ];

  const workspaceIds = [3, 6];
  const bakeryIds = [2, 5];
  const cafeIds = [1, 4, 7, 8];

  const filteredDeals = allDeals.filter((d) => {
    if (filter === "all") return true;
    if (filter === "workspace") return workspaceIds.includes(d.cafeId);
    if (filter === "bakery") return bakeryIds.includes(d.cafeId);
    if (filter === "cafe") return cafeIds.includes(d.cafeId);
    return true;
  });

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-8">
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Deals & Offers</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Exclusive discounts from your favourite cafes — grab them before they expire!
          </p>
        </motion.div>

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-primary/25 via-primary/10 to-transparent border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Coffee className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-semibold uppercase tracking-wider">Limited Time</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              🎉 Weekend Special
            </h2>
            <p className="text-gray-400 text-sm">
              Use code{" "}
              <span className="text-primary font-bold font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                WEEKEND25
              </span>{" "}
              for 25% off at any cafe this weekend!
            </p>
          </div>
        </motion.div>

        {/* Filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-1"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? "bg-primary text-black"
                  : "bg-dark-card border border-dark-border text-gray-400 hover:border-primary/40 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Count */}
        <p className="text-xs text-gray-600 mb-5">
          Showing {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDeals.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}