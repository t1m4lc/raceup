// stores/cart.ts
import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

export type CartParticipant = {
  full_name: string;
  birthdate: string;
  gender: string;
  certificate_url?: string;
  extras: string[];
};

export type CartItem = {
  id: string;
  raceId: string;
  raceName: string;
  raceDate: string;
  distance: number;
  price: number;
  currency: string;
  participants: CartParticipant[];
};

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
}

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
    items: [] as CartItem[],
    isCartOpen: false,
  }),

  getters: {
    totalItems(state: CartState): number {
      return state.items.reduce(
        (total: number, item: CartItem) => total + item.participants.length,
        0
      );
    },

    totalPrice(state: CartState): number {
      return state.items.reduce((total: number, item: CartItem) => {
        return total + item.price * item.participants.length;
      }, 0);
    },

    formattedTotalPrice(state: CartState): string {
      // Assuming all items use the same currency (default to EUR)
      const currency = state.items.length > 0 ? state.items[0].currency : "EUR";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(this.totalPrice / 100);
    },
  },

  actions: {
    generateId() {
      return uuidv4();
    },

    addItem(item: CartItem) {
      // Check if we already have an item for this race
      const existingItemIndex = this.items.findIndex(
        (i) => i.raceId === item.raceId
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        this.items[existingItemIndex] = {
          ...this.items[existingItemIndex],
          participants: [
            ...this.items[existingItemIndex].participants,
            ...item.participants,
          ],
        };
      } else {
        // Add new item
        this.items.push(item);
      }
    },

    updateParticipants(raceId: string, participants: CartParticipant[]) {
      const index = this.items.findIndex((item) => item.raceId === raceId);
      if (index !== -1) {
        this.items[index].participants = participants;
      }
    },

    removeItem(itemId: string) {
      const index = this.items.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    },

    removeParticipant(itemId: string, participantIndex: number) {
      const index = this.items.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        if (this.items[index].participants.length === 1) {
          // If this is the last participant, remove the whole item
          this.items.splice(index, 1);
        } else {
          // Otherwise just remove this participant
          this.items[index].participants.splice(participantIndex, 1);
        }
      }
    },

    clearCart() {
      this.items = [];
    },

    openCart() {
      this.isCartOpen = true;
    },

    closeCart() {
      this.isCartOpen = false;
    },

    toggleCart() {
      this.isCartOpen = !this.isCartOpen;
    },
  },
});
