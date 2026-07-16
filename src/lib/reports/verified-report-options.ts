export type VerifiedReportPeriod = "daily" | "weekly" | "monthly" | "all";
export type VerifiedReportFormat = "csv" | "summary";

export function verifiedReportFormatLabel(format: VerifiedReportFormat): string {
  switch (format) {
    case "csv":
      return "CSV (detailed spreadsheet)";
    case "summary":
      return "Short Summary PDF";
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

export function parseVerifiedReportFormat(value: string | null): VerifiedReportFormat {
  if (value === "csv" || value === "summary") return value;
  return "csv";
}

export function verifiedReportPeriodLabel(period: VerifiedReportPeriod): string {
  switch (period) {
    case "daily":
      return "Today";
    case "weekly":
      return "Last 7 days";
    case "monthly":
      return "Last 30 days";
    case "all":
      return "All time";
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

export function getVerifiedReportDateRange(
  period: VerifiedReportPeriod
): { from?: Date; to: Date } {
  const to = new Date();
  if (period === "all") return { to };

  const from = new Date();
  if (period === "daily") {
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (period === "weekly") {
    from.setDate(from.getDate() - 7);
    return { from, to };
  }
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export function parseVerifiedReportPeriod(value: string | null): VerifiedReportPeriod {
  if (value === "daily" || value === "weekly" || value === "monthly" || value === "all") {
    return value;
  }
  return "all";
}
