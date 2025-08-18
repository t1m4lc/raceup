// composables/useUiState.ts
export const useUiState = () => {
  // Common loading component
  const LoadingSpinner = () =>
    h(
      "div",
      {
        class: "flex justify-center items-center h-64",
      },
      [
        h("div", {
          class:
            "animate-spin h-12 w-12 border-t-4 border-b-4 border-primary rounded-full",
        }),
      ]
    );

  // Common error display
  const ErrorDisplay = (error: string) =>
    h(
      "div",
      {
        class: "bg-destructive/20 text-destructive p-4 rounded-md",
      },
      [h("p", error)]
    );

  // Empty state component
  const EmptyState = (title: string, description?: string) =>
    h(
      "div",
      {
        class: "text-center py-12",
      },
      [
        h("h2", { class: "text-2xl font-semibold mb-4" }, title),
        description
          ? h("p", { class: "text-muted-foreground" }, description)
          : null,
      ].filter(Boolean)
    );

  return {
    LoadingSpinner,
    ErrorDisplay,
    EmptyState,
  };
};
