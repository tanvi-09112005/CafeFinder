import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load favorites from DB whenever user logs in
  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setFavoriteIds(new Set());
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/favorites/${user.id}`);
      const data = await res.json();
      setFavorites(data);
      setFavoriteIds(new Set(data.map(f => f.cafe.id.toString())));
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

    // Optimistic update (instant UI response)
    if (isCurrentlyFavorited) {
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(cafeId); return next; });
      setFavorites(prev => prev.filter(f => f.cafe.id.toString() !== cafeId));
    } else {
      setFavoriteIds(prev => new Set([...prev, cafeId]));
    }

    try {
      await fetch("http://localhost:5000/api/favorites/toggle", {
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
            distance: cafe.distance
          }
        })
      });

      // Refresh to stay in sync with DB
      fetchFavorites();
    } catch (err) {
      console.error("Error toggling favorite:", err);
      fetchFavorites();
    }
  }, [user, favoriteIds]);

  const isFavorite = useCallback((cafeId) => {
    return favoriteIds.has(cafeId?.toString());
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}