// composables/useErrorHandling.ts
export const useErrorHandling = () => {
  // Standard error handler for API calls
  const handleApiError = (error: any, context: string = "operation") => {
    console.error(`Error in ${context}:`, error);

    // Extract meaningful error message
    let message = `Failed to ${context}`;

    if (error?.data?.message) {
      message = error.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    return {
      success: false,
      message,
    };
  };

  // Handle Supabase errors specifically
  const handleSupabaseError = (error: any, context: string = "fetch data") => {
    console.error(`Supabase error in ${context}:`, error);

    let message = `Failed to ${context}`;

    if (error?.message) {
      message = error.message;
    }

    return {
      success: false,
      message,
    };
  };

  // Generic async operation wrapper with error handling
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context: string = "operation"
  ): Promise<{ data?: T; success: boolean; message?: string }> => {
    try {
      const data = await operation();
      return { data, success: true };
    } catch (error) {
      const result = handleApiError(error, context);
      return result;
    }
  };

  return {
    handleApiError,
    handleSupabaseError,
    withErrorHandling,
  };
};
