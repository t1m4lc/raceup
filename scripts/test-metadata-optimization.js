// Test script to validate metadata size optimization
const cartItems = [{
  "id": "8821ce2d-7218-4f72-a85b-587e223e1eca",
  "raceId": "21111111-1111-1111-1111-111111111111", 
  "raceName": "10K Trail",
  "price": 2500,
  "currency": "EUR",
  "organizationId": "11111111-1111-1111-1111-111111111111",
  "participants": [{
    "first_name": "John",
    "last_name": "Doe", 
    "birthdate": "1990-05-15",
    "gender": "Male",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+33123456789",
    "medicalNotes": "No allergies",
    "extras": [{
      "id": "tshirt",
      "name": "T-Shirt M", 
      "price": 15,
      "quantity": 1
    }, {
      "id": "meal",
      "name": "Race Meal",
      "price": 12, 
      "quantity": 1
    }]
  }]
}];

// Original metadata that was too long (532 characters)
const originalMetadata = JSON.stringify(cartItems);
console.log('Original metadata length:', originalMetadata.length);
console.log('Original metadata:', originalMetadata);

// New optimized metadata approach
const essentialData = {
  organization_id: "11111111-1111-1111-1111-111111111111",
  event_id: "22222222-2222-2222-2222-222222222222", 
  primary_race_id: cartItems[0].raceId,
  cart_count: cartItems.length,
  total_participants: cartItems.reduce((sum, item) => sum + item.participants.length, 0)
};

const optimizedMetadata = {
  user_id: "33333333-3333-3333-3333-333333333333",
  user_email: "test@example.com",
  contact_email: "test@example.com", 
  organization_id: essentialData.organization_id,
  event_id: essentialData.event_id,
  primary_race_id: essentialData.primary_race_id,
  cart_count: essentialData.cart_count.toString(),
  total_participants: essentialData.total_participants.toString(),
  platform_fee_cents: "250",
  has_full_data: "pending_webhook"
};

const optimizedMetadataStr = JSON.stringify(optimizedMetadata);
console.log('\nOptimized metadata length:', optimizedMetadataStr.length);
console.log('Optimized metadata:', optimizedMetadataStr);
console.log('\nSavings:', originalMetadata.length - optimizedMetadataStr.length, 'characters');
console.log('Within Stripe limit (500 chars):', optimizedMetadataStr.length <= 500 ? '✅ YES' : '❌ NO');

export { optimizedMetadata, essentialData };
