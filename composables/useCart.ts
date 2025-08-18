import { computed } from "vue";
import type { CartItem, CartParticipant } from "~/stores/cart";

export type CartExtra = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
};

export const useCart = () => {
  const items = useState<CartItem[]>("cart-items", () => []);
  const isCartOpen = useState<boolean>("cart-open", () => false);

  // Use shared pricing utilities
  const { formatPrice } = usePricing();

  const totalItems = computed(() => {
    return items.value.reduce(
      (total: number, item: CartItem) => total + item.participants.length,
      0
    );
  });

  const totalPrice = computed(() => {
    return items.value.reduce((total: number, item: CartItem) => {
      return total + item.price * item.participants.length;
    }, 0);
  });

  const formattedTotalPrice = computed(() => {
    // Assuming all items use the same currency (default to EUR)
    const currency = items.value.length > 0 ? items.value[0].currency : "EUR";
    return formatPrice(totalPrice.value, currency);
  });

  function addItem(item: CartItem) {
    // Check if we already have an item for this race
    const existingItemIndex = items.value.findIndex(
      (i) => i.raceId === item.raceId
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      items.value[existingItemIndex] = {
        ...items.value[existingItemIndex],
        participants: [
          ...items.value[existingItemIndex].participants,
          ...item.participants,
        ],
      };
    } else {
      // Add new item
      items.value.push(item);
    }
  }

  function updateParticipants(raceId: string, participants: CartParticipant[]) {
    const index = items.value.findIndex((item) => item.raceId === raceId);
    if (index !== -1) {
      items.value[index].participants = participants;
    }
  }

  function removeItem(itemId: string) {
    const index = items.value.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }

  function removeParticipant(itemId: string, participantIndex: number) {
    const index = items.value.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      if (items.value[index].participants.length === 1) {
        // If this is the last participant, remove the whole item
        items.value.splice(index, 1);
      } else {
        // Otherwise just remove this participant
        items.value[index].participants.splice(participantIndex, 1);
      }
    }
  }

  function clearCart() {
    items.value = [];
  }

  function openCart() {
    isCartOpen.value = true;
  }

  function closeCart() {
    isCartOpen.value = false;
  }

  function toggleCart() {
    isCartOpen.value = !isCartOpen.value;
  }

  return {
    items,
    isCartOpen,
    totalItems,
    totalPrice,
    formattedTotalPrice,
    addItem,
    updateParticipants,
    removeItem,
    removeParticipant,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  };
};
