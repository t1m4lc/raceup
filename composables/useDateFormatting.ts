// composables/useDateFormatting.ts
export const useDateFormatting = () => {
  const dayjs = useDayjs();

  // Prebuilt dayjs formats
  const formats = {
    short: "M/D/YY", // 8/18/25
    medium: "MMM D, YYYY", // Aug 18, 2025
    long: "MMMM D, YYYY", // August 18, 2025
    full: "dddd, MMMM D, YYYY", // Monday, August 18, 2025
    time12: "h:mm A", // 2:30 PM
    time24: "HH:mm", // 14:30
    datetime: "MMM D, YYYY h:mm A", // Aug 18, 2025 2:30 PM
    iso: "YYYY-MM-DD", // 2025-08-18
    year: "YYYY", // 2025
    monthYear: "MMM YYYY", // Aug 2025
  };

  // Format with prebuilt formats
  const formatDate = (
    dateString: string,
    format: keyof typeof formats | string = "medium"
  ) => {
    const formatString = formats[format as keyof typeof formats] || format;
    return dayjs(dateString).format(formatString);
  };

  // Smart date range formatting
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (start.isSame(end, "day")) {
      return start.format(formats.medium);
    }

    if (start.isSame(end, "month")) {
      return `${start.format("MMM D")} - ${end.format("D, YYYY")}`;
    }

    if (start.isSame(end, "year")) {
      return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
    }

    return `${start.format(formats.medium)} - ${end.format(formats.medium)}`;
  };

  // Quick format functions using prebuilt formats
  const formatShort = (dateString: string) => formatDate(dateString, "short");
  const formatMedium = (dateString: string) => formatDate(dateString, "medium");
  const formatLong = (dateString: string) => formatDate(dateString, "long");
  const formatFull = (dateString: string) => formatDate(dateString, "full");

  // Time formatting
  const formatTime12 = (dateString: string) => formatDate(dateString, "time12");
  const formatTime24 = (dateString: string) => formatDate(dateString, "time24");
  const formatDateTime = (dateString: string) =>
    formatDate(dateString, "datetime");

  // Utility functions
  const formatRelativeTime = (dateString: string) =>
    dayjs(dateString).fromNow();
  const isToday = (dateString: string) =>
    dayjs(dateString).isSame(dayjs(), "day");
  const isTomorrow = (dateString: string) =>
    dayjs(dateString).isSame(dayjs().add(1, "day"), "day");
  const isYesterday = (dateString: string) =>
    dayjs(dateString).isSame(dayjs().subtract(1, "day"), "day");

  // Parse and validation
  const parseDate = (dateString: string) => dayjs(dateString);
  const isValidDate = (dateString: string) => dayjs(dateString).isValid();

  return {
    // Core formatting
    formatDate,
    formatDateRange,

    // Quick formats
    formatShort,
    formatMedium,
    formatLong,
    formatFull,

    // Time formats
    formatTime12,
    formatTime24,
    formatDateTime,

    // Utility functions
    formatRelativeTime,
    isToday,
    isTomorrow,
    isYesterday,
    parseDate,
    isValidDate,

    // Export formats for custom usage
    formats,
  };
};
