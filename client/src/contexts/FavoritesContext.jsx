import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { API } from "../config";
const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchFavorites();
    else { setFavorites([]); setFavoriteIds(new Set()); }
  }, [user?.id]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/favorites/${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFavorites(data);
        setFavoriteIds(new Set(data.map(f => f.cafe.id.toString())));
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (cafe) => {
    if (!user?.id) return;
    const cafeId = (cafe._id || cafe.id)?.toString();
    const isCurrentlyFavorited = favoriteIds.has(cafeId);

    // Optimistic update
    if (isCurrentlyFavorited) {
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(cafeId); return next; });
      setFavorites(prev => prev.filter(f => f.cafe.id.toString() !== cafeId));
    } else {
      setFavoriteIds(prev => new Set([...prev, cafeId]));
    }

    try {
      await fetch(`${API}/api/favorites/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          cafe: {
            id: cafeId,
            name: cafe.name,
            address: cafe.address,
            photo: cafe.photo || cafe.photos?.[0],
            cuisine: cafe.cuisine,
            rating: cafe.rating,
            distance: cafe.distance,
          }
        })
      });
      fetchFavorites();
    } catch (err) {
      console.error("Error toggling favorite:", err);
      fetchFavorites();
    }
  }, [user, favoriteIds]);

  const isFavorite = useCallback(
    (cafeId) => favoriteIds.has(cafeId?.toString()),
    [favoriteIds]
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