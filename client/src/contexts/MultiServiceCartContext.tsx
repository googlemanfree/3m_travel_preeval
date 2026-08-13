import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartServiceType = "flight" | "hotel" | "vehicle";
export type CartPriceStatus = "live" | "indicative" | "on_request";

export type MultiServiceCartItem = {
  id: string;
  serviceType: CartServiceType;
  title: string;
  subtitle: string;
  image?: string;
  price: number;
  currency: string;
  quantity: number;
  priceStatus: CartPriceStatus;
  metadata: Record<string, string | number | boolean | null | undefined>;
};

type CartContextValue = {
  items: MultiServiceCartItem[];
  totalItems: number;
  pricedItemsTotal: number;
  hasOnRequestItems: boolean;
  addItem: (item: Omit<MultiServiceCartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const STORAGE_KEY = "3m_travel_multi_service_cart_v1";

const MultiServiceCartContext = createContext<CartContextValue | null>(null);

function readInitialItems(): MultiServiceCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is MultiServiceCartItem =>
      item && typeof item.id === "string" &&
      ["flight", "hotel", "vehicle"].includes(item.serviceType) &&
      typeof item.title === "string" && typeof item.price === "number"
    );
  } catch {
    return [];
  }
}

export function MultiServiceCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MultiServiceCartItem[]>(readInitialItems);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<MultiServiceCartItem, "quantity"> & { quantity?: number }) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) => entry.id === item.id
          ? { ...entry, quantity: Math.min(9, entry.quantity + (item.quantity ?? 1)) }
          : entry
        );
      }
      return [...current, { ...item, quantity: item.quantity ?? 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(9, quantity) } : item));
  };

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const pricedItemsTotal = items.reduce((sum, item) => sum + (item.priceStatus === "on_request" ? 0 : item.price * item.quantity), 0);
    return {
      items,
      totalItems,
      pricedItemsTotal,
      hasOnRequestItems: items.some((item) => item.priceStatus === "on_request"),
      addItem,
      removeItem,
      updateQuantity,
      clearCart: () => setItems([]),
      isOpen,
      setIsOpen,
    };
  }, [items, isOpen]);

  return <MultiServiceCartContext.Provider value={value}>{children}</MultiServiceCartContext.Provider>;
}

export function useMultiServiceCart() {
  const context = useContext(MultiServiceCartContext);
  if (!context) throw new Error("useMultiServiceCart doit être utilisé dans MultiServiceCartProvider");
  return context;
}
