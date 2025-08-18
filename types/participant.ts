// Shared types for participant data
export interface CartExtra {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
}

export interface CartParticipant {
  first_name: string;
  last_name: string;
  birthdate: string;
  gender: string;
  certificate_url?: string;
  extras: CartExtra[];
  isUser?: boolean;
  userId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

export interface TicketExtra {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  max_quantity?: number;
}

// Helper function to get full name
export function getFullName(participant: CartParticipant): string {
  return `${participant.first_name || ""} ${participant.last_name || ""}`.trim();
}
