import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type CartLine = {
  productId: string;
  title: string;
  priceUsd: number;
  imageUrl: string | null;
  quantity: number;
  productType: 'merchandise' | 'digital';
};

type StoreCartContextValue = {
  creatorUsername: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotalUsd: number;
  addItem: (creatorUsername: string, line: Omit<CartLine, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback(
    (creator: string, item: Omit<CartLine, 'quantity'> & { quantity?: number }) => {
      const qty = item.quantity ?? 1;
      setLines((prev) => {
        if (creatorUsername && creatorUsername !== creator) {
          return [{ ...item, quantity: qty }];
        }
        const existing = prev.find((l) => l.productId === item.productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === item.productId ? { ...l, quantity: l.quantity + qty } : l,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
      setCreatorUsername(creator);
    },
    [creatorUsername],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setCreatorUsername(null);
  }, []);

  const itemCount = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const subtotalUsd = useMemo(
    () => lines.reduce((sum, l) => sum + l.priceUsd * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      creatorUsername,
      lines,
      itemCount,
      subtotalUsd,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [creatorUsername, lines, itemCount, subtotalUsd, addItem, updateQuantity, removeItem, clearCart],
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart() {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error('useStoreCart must be used within StoreCartProvider');
  return ctx;
}
