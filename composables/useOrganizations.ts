// composables/useOrganizations.ts
export const useOrganizations = () => {
  const client = useSupabaseClient();

  // Fetch organizations with optional additional data
  const fetchOrganizations = async (
    options: {
      includeEvents?: boolean;
      includeMembers?: boolean;
      orderBy?: "name" | "created_at";
      ascending?: boolean;
    } = {}
  ) => {
    const {
      includeEvents = false,
      includeMembers = false,
      orderBy = "name",
      ascending = true,
    } = options;

    let selectQuery = "*";

    if (includeEvents) {
      selectQuery += ", events(*)";
    }

    if (includeMembers) {
      selectQuery += `, organization_members(
        id, role,
        profile: profiles (
          id, full_name, avatar_url
        )
      )`;
    }

    const { data, error } = await client
      .from("organizations")
      .select(selectQuery)
      .order(orderBy, { ascending });

    if (error) throw error;
    return data || [];
  };

  // Fetch organizations for current user (as organizer/founder)
  const fetchUserOrganizations = async (userId: string) => {
    const { data, error } = await client
      .from("organizations")
      .select("*")
      .eq("founder_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  // Fetch organizations with Stripe Connect data
  const fetchOrganizationsWithStripe = async () => {
    const { data, error } = await client
      .from("organizations")
      .select(
        "id, name, description, stripe_account_id, stripe_onboarding_completed, founder_id"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  return {
    fetchOrganizations,
    fetchUserOrganizations,
    fetchOrganizationsWithStripe,
  };
};
