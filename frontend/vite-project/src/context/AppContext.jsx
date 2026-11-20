import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, setToken } from '../api/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const loadState = useCallback(async () => {
    const state = await api.get('/me/state');
    setFavorites(state.favorites);
    setCart(Object.fromEntries(state.cart.map((c) => [c.product_id, c.quantity])));
  }, []);

  const resetSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setFavorites([]);
    setCart({});
  }, []);

  // восстановление сессии при загрузке страницы
  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me')
      .then(async (data) => {
        setUser(data.user);
        await loadState();
      })
      .catch((error) => {
        if (error.status === 401) resetSession();
      });
  }, [loadState, resetSession]);

  const signIn = useCallback(async ({ token, user: nextUser }) => {
    setToken(token);
    setUser(nextUser);
    setLoginOpen(false);
    try {
      await loadState();
    } catch {
      /* состояние подтянется при следующем запросе */
    }
    showToast(`Здравствуйте, ${nextUser.name}!`);
  }, [loadState, showToast]);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* сессия уже недействительна */
    }
    resetSession();
  }, [resetSession]);

  // если действие требует входа — открываем окно авторизации
  const requireAuth = useCallback(() => {
    if (user) return true;
    setLoginOpen(true);
    return false;
  }, [user]);

  const toggleFavorite = useCallback(async (productId) => {
    if (!requireAuth()) return;
    const active = favorites.includes(productId);
    setFavorites((list) => (active ? list.filter((id) => id !== productId) : [...list, productId]));
    try {
      if (active) await api.delete(`/favorites/${productId}`);
      else await api.put(`/favorites/${productId}`);
    } catch (error) {
      setFavorites((list) => (active ? [...list, productId] : list.filter((id) => id !== productId)));
      showToast(error.message);
    }
  }, [favorites, requireAuth, showToast]);

  const setQuantity = useCallback(async (productId, quantity) => {
    if (!requireAuth()) return false;
    const previous = cart[productId] || 0;
    const next = Math.max(0, Math.min(quantity, 99));
    setCart((current) => {
      const copy = { ...current };
      if (next === 0) delete copy[productId];
      else copy[productId] = next;
      return copy;
    });
    try {
      await api.put(`/cart/${productId}`, { quantity: next });
      return true;
    } catch (error) {
      setCart((current) => {
        const copy = { ...current };
        if (previous === 0) delete copy[productId];
        else copy[productId] = previous;
        return copy;
      });
      showToast(error.message);
      return false;
    }
  }, [cart, requireAuth, showToast]);

  const clearCart = useCallback(() => setCart({}), []);

  const cartCount = useMemo(() => Object.values(cart).reduce((sum, q) => sum + q, 0), [cart]);

  const value = {
    user, setUser, favorites, cart, cartCount,
    loginOpen, setLoginOpen, signIn, signOut, requireAuth,
    toggleFavorite, setQuantity, clearCart, toast, showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
