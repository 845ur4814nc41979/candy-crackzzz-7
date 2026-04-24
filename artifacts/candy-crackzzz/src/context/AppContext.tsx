import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Product, OrderRequest, Settings, CartItem, Review, RewardProfile } from '../types';
import { defaultSettings, sampleProducts } from '../lib/defaults';
import { apiGetBootstrap, apiPersistState } from '../lib/api';
import { useAuth } from './AuthContext';

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: OrderRequest[];
  setOrders: React.Dispatch<React.SetStateAction<OrderRequest[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  rewardProfiles: RewardProfile[];
  setRewardProfiles: React.Dispatch<React.SetStateAction<RewardProfile[]>>;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded: isAuthLoaded, isOwner } = useAuth();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rewardProfiles, setRewardProfiles] = useState<RewardProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedCart = localStorage.getItem('cart');
    if (loadedCart) {
      try {
        setCart(JSON.parse(loadedCart));
      } catch {
        setCart([]);
      }
    }

    let isMounted = true;

    const loadBootstrap = async () => {
      try {
        const bootstrap = await apiGetBootstrap();
        if (!isMounted) return;
        setProducts(bootstrap.state.products?.length ? bootstrap.state.products : sampleProducts);
        setOrders(bootstrap.state.orders ?? []);
        setSettings({ ...defaultSettings, ...(bootstrap.state.settings ?? {}) });
        setReviews(bootstrap.state.reviews ?? []);
        setRewardProfiles(bootstrap.state.rewardProfiles ?? []);
      } catch (error) {
        console.error('Failed to load backend app state.', error);
        if (!isMounted) return;
        setProducts(sampleProducts);
        setOrders([]);
        setSettings(defaultSettings);
        setReviews([]);
        setRewardProfiles([]);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    void loadBootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || !isOwner) return;
    void apiPersistState('products', products).catch((error) => console.error('Failed to persist products.', error));
  }, [products, isLoaded, isAuthLoaded, isOwner]);

  useEffect(() => {
    if (!isLoaded) return;
    void apiPersistState('orders', orders).catch((error) => console.error('Failed to persist orders.', error));
  }, [orders, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || !isOwner) return;
    void apiPersistState('settings', settings).catch((error) => console.error('Failed to persist settings.', error));
  }, [settings, isLoaded, isAuthLoaded, isOwner]);

  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || !isOwner) return;
    void apiPersistState('reviews', reviews).catch((error) => console.error('Failed to persist reviews.', error));
  }, [reviews, isLoaded, isAuthLoaded, isOwner]);

  useEffect(() => {
    if (!isLoaded) return;
    void apiPersistState('rewardProfiles', rewardProfiles).catch((error) => console.error('Failed to persist reward profiles.', error));
  }, [rewardProfiles, isLoaded]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart(prev => [...prev, { ...item, id: Math.random().toString(36).substring(2, 9) }]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + ((item.price || 0) * item.quantity), 0),
    [cart],
  );

  if (!isLoaded) return null;

  return (
    <AppContext.Provider value={{
      products, setProducts,
      orders, setOrders,
      settings, setSettings,
      cart, setCart,
      reviews, setReviews,
      rewardProfiles, setRewardProfiles,
      addToCart, removeFromCart, clearCart, cartTotal,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
