import { createContext, useContext, useState, useCallback } from "react";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = useCallback((cafe) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f._id === cafe._id);
      if (exists) return prev.filter((f) => f._id !== cafe._id);
      return [...prev, cafe];
    });
  }, []);

  const isFavorite = useCallback(
    (cafeId) => favorites.some((f) => f._id === cafeId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}