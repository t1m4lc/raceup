// composables/useOrganizationData.ts
export const useOrganizationData = () => {
  const user = useSupabaseUser();

  // Fetch user's organizations with caching
  const {
    data: organizations,
    pending: organizationsLoading,
    error: organizationsError,
    refresh: refreshOrganizations,
  } = useLazyAsyncData(
    "user-organizations",
    async () => {
      if (!user.value?.id) return [];

      const response = await $fetch(`/api/organizations`, {
        query: { userId: user.value.id },
      });

      return response || [];
    },
    {
      default: () => [],
      watch: [user],
    }
  );

  // Fetch specific organization by slug
  const fetchOrganization = async (slug: string) => {
    const {
      data: organization,
      pending,
      error,
    } = await useLazyAsyncData(`organization-${slug}`, () =>
      $fetch(`/api/organizations/${slug}`)
    );

    return { organization, pending, error };
  };

  // Create new organization
  const createOrganization = async (organizationData: any) => {
    try {
      const data = await $fetch("/api/organizations", {
        method: "POST",
        body: organizationData,
      });

      // Refresh the organizations list
      await refreshOrganizations();

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Update organization
  const updateOrganization = async (slug: string, updates: any) => {
    try {
      const data = await $fetch(`/api/organizations/${slug}`, {
        method: "PATCH",
        body: updates,
      });

      // Refresh the organizations list
      await refreshOrganizations();

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    organizations: readonly(organizations),
    organizationsLoading: readonly(organizationsLoading),
    organizationsError: readonly(organizationsError),
    refreshOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
  };
};
