import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function InstallBanner() {
  const { canInstall, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
      >
        <div className="bg-dark-card border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Install CaféFinder</p>
            <p className="text-gray-500 text-xs mt-0.5">Add to home screen for the best experience</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={install}
              className="px-3 py-1.5 rounded-xl bg-primary text-black text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}