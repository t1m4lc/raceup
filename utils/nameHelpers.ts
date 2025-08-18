// Helper functions for handling names after full_name removal

export interface PersonWithNames {
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * Gets display name from first_name and last_name
 * @param person Object with first_name and last_name properties
 * @returns Formatted display name
 */
export function getDisplayName(
  person: PersonWithNames | null | undefined
): string {
  if (!person) return "";

  const firstName = person.first_name?.trim() || "";
  const lastName = person.last_name?.trim() || "";

  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "Unnamed";
}

/**
 * Gets initials from first_name and last_name
 * @param person Object with first_name and last_name properties
 * @returns Initials (e.g., "JD" for John Doe)
 */
export function getInitials(
  person: PersonWithNames | null | undefined
): string {
  if (!person) return "??";

  const firstInitial = person.first_name?.charAt(0)?.toUpperCase() || "?";
  const lastInitial = person.last_name?.charAt(0)?.toUpperCase() || "";

  return `${firstInitial}${lastInitial}`;
}

/**
 * Splits a full name into first_name and last_name
 * @param fullName Full name string
 * @returns Object with first_name and last_name
 */
export function splitFullName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  if (!fullName?.trim()) {
    return { first_name: "", last_name: "" };
  }

  const parts = fullName.trim().split(" ");

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "" };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  return { first_name: firstName, last_name: lastName };
}

/**
 * Formats a name for search/filtering (lowercase, no extra spaces)
 * @param person Object with first_name and last_name properties
 * @returns Searchable name string
 */
export function getSearchableName(
  person: PersonWithNames | null | undefined
): string {
  return getDisplayName(person).toLowerCase();
}
