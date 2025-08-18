import { serverSupabaseServiceRole } from "#supabase/server";
import { useServerStripe } from "#stripe/server";
import * as QRCode from "qrcode";
import type { Database } from "~/supabase/supabase";

export default defineEventHandler(async (event) => {
  try {
    // Get the Stripe webhook secret from environment variable
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeWebhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    }

    // Initialize Stripe using the module's composable
    const stripe = await useServerStripe(event);

    // Get the raw body as string for signature verification
    const rawBody = await readRawBody(event);
    const signature = getHeader(event, "stripe-signature");

    if (!signature || !rawBody) {
      throw createError({
        statusCode: 400,
        message: "Missing Stripe signature or request body",
      });
    }

    // Verify the webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      throw createError({
        statusCode: 400,
        message: `Webhook Error: ${err.message}`,
      });
    }

    // Get the database client (using service role for this to bypass RLS)
    const supabase = serverSupabaseServiceRole<Database>(event);

    // Handle the event
    if (stripeEvent.type === "payment_intent.succeeded") {
      const paymentIntent = stripeEvent.data.object;

      // First check if tickets already exist for this payment intent
      const { data: existingTickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (existingTickets && existingTickets.length > 0) {
        // Tickets already exist, just update status
        await supabase
          .from("tickets")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        return { received: true, message: "Ticket status updated" };
      }

      // No existing tickets - create them from payment intent metadata
      const metadata = paymentIntent.metadata;

      if (!metadata.cart_items || !metadata.user_id) {
        throw new Error("Invalid payment intent metadata - missing cart data");
      }

      const cartItems = JSON.parse(metadata.cart_items);
      const contactInfo = JSON.parse(metadata.contact_info || "{}");
      const userId = metadata.user_id;

      // Create tickets and participants for each cart item
      for (const cartItem of cartItems) {
        // Calculate price for this cart item
        const { data: race } = await supabase
          .from("races")
          .select("*")
          .eq("id", cartItem.raceId)
          .single();

        if (!race) {
          console.error(`Race not found: ${cartItem.raceId}`);
          continue;
        }

        const raceTotal = race.price_cents * cartItem.participants.length;
        const extrasTotal = cartItem.participants.reduce(
          (total: number, participant: any) => {
            if (participant.extras && participant.extras.length > 0) {
              return (
                total +
                participant.extras.reduce((sum: number, extra: any) => {
                  return sum + extra.price * extra.quantity * 100;
                }, 0)
              );
            }
            return total;
          },
          0
        );

        const itemTotal = raceTotal + extrasTotal;

        // Create ticket
        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            race_id: race.id,
            purchaser_id: userId,
            total_price_cents: itemTotal,
            currency: race.currency,
            stripe_payment_intent_id: paymentIntent.id,
            status: "paid", // Already paid at this point
          })
          .select()
          .single();

        if (ticketError || !ticket) {
          console.error("Error creating ticket:", ticketError);
          continue;
        }

        // Create participants for this ticket
        const participantsToInsert = cartItem.participants.map(
          (participant: any) => ({
            ticket_id: ticket.id,
            fullname: `${participant.first_name} ${participant.last_name}`,
            birthdate: participant.birthdate,
            gender: participant.gender,
            emergency_contact_name: participant.emergencyContactName || null,
            emergency_contact_phone: participant.emergencyContactPhone || null,
            medical_notes: participant.medicalNotes || null,
          })
        );

        const { error: participantsError } = await supabase
          .from("participants")
          .insert(participantsToInsert);

        if (participantsError) {
          console.error("Error creating participants:", participantsError);
        }

        // Create payment record
        await supabase.from("payments").insert({
          ticket_id: ticket.id,
          amount_cents: itemTotal,
          application_fee_cents: Math.round(
            paymentIntent.application_fee_amount || 0
          ),
          stripe_payment_intent_id: paymentIntent.id,
          status: "completed",
        });
      }

      // Generate individual tickets with QR codes for each participant
      if (
        (ticket as any).participants &&
        Array.isArray((ticket as any).participants)
      ) {
        for (const participant of (ticket as any).participants) {
          try {
            // Generate unique QR code data
            const qrData = await generateQRCodeData(
              (ticket as any).id,
              participant.id
            );

            // Generate QR code as data URL
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
              errorCorrectionLevel: "M",
              margin: 1,
              width: 256,
            });

            // Generate unique ticket number
            const ticketNumber = await generateTicketNumber();

            // Create individual ticket using raw SQL to avoid type issues
            const { error: individualTicketError } = await supabase.rpc(
              "create_individual_ticket",
              {
                p_ticket_id: (ticket as any).id,
                p_participant_id: participant.id,
                p_qr_code_data: qrData,
                p_ticket_number: ticketNumber,
                p_is_user_linked: (participant as any).user_id ? true : false,
                p_linked_user_id: (participant as any).user_id || null,
              }
            );

            if (individualTicketError) {
              console.error(
                `Error creating individual ticket for participant ${participant.id}:`,
                individualTicketError
              );
              throw new Error(
                `Failed to create individual ticket: ${individualTicketError.message}`
              );
            }

            console.log(
              `✅ Generated individual ticket ${ticketNumber} for participant ${participant.first_name} ${participant.last_name}`
            );
          } catch (error) {
            console.error(
              `Error generating ticket for participant ${participant.id}:`,
              error
            );
            throw error;
          }
        }
      }

      // Update the payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_method:
            typeof paymentIntent.payment_method === "string"
              ? paymentIntent.payment_method
              : paymentIntent.payment_method?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (paymentError) {
        console.error("Error updating payment record:", paymentError);
        throw new Error(
          `Failed to update payment record: ${paymentError.message}`
        );
      }

      console.log(
        `✅ Successfully processed payment and generated tickets for payment intent: ${paymentIntent.id}`
      );
    } else if (stripeEvent.type === "payment_intent.payment_failed") {
      const paymentIntent = stripeEvent.data.object;

      // Update the ticket status
      await supabase
        .from("tickets")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      // Update the payment record
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      console.log(`❌ Payment failed for payment intent: ${paymentIntent.id}`);
    }

    // Return a success response
    return { received: true };
  } catch (error: any) {
    console.error("Error handling Stripe webhook:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "An error occurred handling the webhook",
    });
  }
});

// Helper function to generate secure QR code data
async function generateQRCodeData(
  ticketId: string,
  participantId: string
): Promise<string> {
  const timestamp = Date.now().toString();
  const dataToHash = `${ticketId}-${participantId}-${timestamp}`;

  // Create a secure hash
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Return a verification URL format
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "https://your-domain.com";
  return `${baseUrl}/verify-ticket?code=${hashHex}&t=${ticketId}&p=${participantId}`;
}

// Helper function to generate unique ticket number
async function generateTicketNumber(): Promise<string> {
  // Generate a random 6-digit number with prefix
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `TK${randomNum}`;
}
