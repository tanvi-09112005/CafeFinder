import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar'; // 👈 Add this import
import BottomNav from './components/BottomNav'; // 👈 Add this import
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import CafeDetail from './pages/CafeDetail';
import Profile from './pages/Profile';

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  // Check if current path is auth page (login/signup)
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {/* Only show Navbar and BottomNav on non-auth pages */}
      {!isAuthPage && <Navbar />}
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes - redirect to home if already logged in */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/" replace /> : <Signup />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cafe/:id" 
            element={
              <ProtectedRoute>
                <CafeDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AnimatePresence>
      
      {/* Only show BottomNav on non-auth pages */}
      {!isAuthPage && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-bg text-white">
          <AnimatedRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;