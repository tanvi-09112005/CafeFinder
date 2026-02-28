import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import CafeDetail from "./pages/CafeDetail";
import Favorites from "./pages/Favorites";
import Deals from "./pages/Deals";
import Profile from "./pages/Profile";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Home />} />
        <Route path="/cafe/:id" element={<CafeDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/profile" element={<Profile />} />
        {/* Catch-all routes */}
        <Route path="/popular" element={<Home />} />
        <Route path="/nearby" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-bg text-white font-poppins">
        <Navbar />
        <AnimatedRoutes />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
