import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const API = "http://localhost:5000";
const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch favorites from backend whenever the logged-in user changes
  useEffect(() => {
    if (!user?.id) {
      setFavorites([]); // clear on logout
      return;
    }

    setLoading(true);
    fetch(`${API}/api/users/${user.id}/favorites`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFavorites(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]); // re-runs on login AND logout

  const toggleFavorite = useCallback(async (cafe) => {
    const isAlreadyFav = favorites.some(f => f._id === cafe._id);

    // Optimistic update
    setFavorites(prev =>
      isAlreadyFav ? prev.filter(f => f._id !== cafe._id) : [...prev, cafe]
    );

    if (!user?.id) return; // guest — local state only

    try {
      const method = isAlreadyFav ? "DELETE" : "POST";
      const res = await fetch(`${API}/api/users/${user.id}/favorites/${cafe._id}`, { method });
      const updated = await res.json();
      if (Array.isArray(updated)) setFavorites(updated);
    } catch (err) {
      console.error("Failed to sync favorite:", err);
      // Revert on error
      setFavorites(prev =>
        isAlreadyFav ? [...prev, cafe] : prev.filter(f => f._id !== cafe._id)
      );
    }
  }, [favorites, user?.id]);

  const isFavorite = useCallback(
    (cafeId) => favorites.some(f => f._id === cafeId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}