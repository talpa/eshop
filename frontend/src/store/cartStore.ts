import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(i => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: Math.min(quantity, product.stock) }] };
        });
      },
      removeItem: (productId) => set((state) => ({ items: state.items.filter(i => i.product.id !== productId) })),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return; }
        set((state) => ({
          items: state.items.map(i => i.product.id === productId ? { ...i, quantity } : i),
        }));
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + Number(i.product.priceCzk) * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'eshop-cart' }
  )
);
