// composables/useApiError.ts
export const useApiError = () => {
  const toast = useToast();

  // Handle API errors with user-friendly messages
  const handleError = (error: any, context = "Operation") => {
    console.error(`${context} error:`, error);

    let message = "An unexpected error occurred";

    if (error?.data?.message) {
      message = error.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    // Show toast notification if available
    if (toast) {
      toast.toast({
        title: `${context} Failed`,
        description: message,
        variant: "destructive",
      });
    }

    return message;
  };

  // Wrapper for async operations with error handling
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context = "Operation"
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      const errorMessage = handleError(error, context);
      return { data: null, error: errorMessage };
    }
  };

  // Success notification helper
  const showSuccess = (title: string, description?: string) => {
    if (toast) {
      toast.toast({
        title,
        description,
        variant: "default",
      });
    }
  };

  return {
    handleError,
    withErrorHandling,
    showSuccess,
  };
};
