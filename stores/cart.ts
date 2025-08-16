// stores/cart.ts
import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { useCommission as useCommissionHook } from "~/composables/useCommission";
import { useLocalStorage } from "@vueuse/core";

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
  organizationId: string;
};

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  commissionConfig: {
    fixedFeeCents: number;
    variablePercent: number;
    feeAllocation: "participant" | "organizer" | "split";
  };
}

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
    items: [] as CartItem[],
    isCartOpen: false,
    commissionConfig: {
      fixedFeeCents: 100, // 1 EUR default
      variablePercent: 3.5, // 3.5% default
      feeAllocation: "participant" as "participant" | "organizer" | "split",
    },
  }),

  getters: {
    totalItems(state: CartState): number {
      return state.items.reduce(
        (total: number, item: CartItem) => total + item.participants.length,
        0
      );
    },

    subtotalPrice(state: CartState): number {
      return state.items.reduce((total: number, item: CartItem) => {
        return total + item.price * item.participants.length;
      }, 0);
    },

    feesAmount(state: CartState): number {
      const { calculateFees } = useCommissionHook();

      const fees = calculateFees(this.subtotalPrice, state.commissionConfig);
      return fees.totalFeeCents;
    },

    totalPrice(state: CartState): number {
      const { calculateFees } = useCommissionHook();

      const fees = calculateFees(this.subtotalPrice, state.commissionConfig);
      return fees.finalAmountCents;
    },

    formattedSubtotalPrice(state: CartState): string {
      // Assuming all items use the same currency (default to EUR)
      const currency = state.items.length > 0 ? state.items[0].currency : "EUR";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(this.subtotalPrice / 100);
    },

    formattedFeesAmount(state: CartState): string {
      // Assuming all items use the same currency (default to EUR)
      const currency = state.items.length > 0 ? state.items[0].currency : "EUR";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(this.feesAmount / 100);
    },

    formattedTotalPrice(state: CartState): string {
      // Assuming all items use the same currency (default to EUR)
      const currency = state.items.length > 0 ? state.items[0].currency : "EUR";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(this.totalPrice / 100);
    },

    feeAllocationLabel(state: CartState): string {
      switch (state.commissionConfig.feeAllocation) {
        case "participant":
          return "paid by participant";
        case "organizer":
          return "paid by organizer";
        case "split":
          return "split equally";
        default:
          return "";
      }
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

    // Set or update the commission configuration
    updateCommissionConfig(config: {
      fixedFeeCents?: number;
      variablePercent?: number;
      feeAllocation?: "participant" | "organizer" | "split";
    }) {
      if (config.fixedFeeCents !== undefined) {
        this.commissionConfig.fixedFeeCents = config.fixedFeeCents;
      }

      if (config.variablePercent !== undefined) {
        this.commissionConfig.variablePercent = config.variablePercent;
      }

      if (config.feeAllocation !== undefined) {
        this.commissionConfig.feeAllocation = config.feeAllocation;
      }
    },
  },

  // We're using Vue's reactivity for persistence
});
