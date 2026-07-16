/** Club / committee sections — kept in sync with seed and Raise Request */
export const CLUB_SECTIONS = [
  { code: "CORAL", label: "Coral Anniversary Committee" },
  { code: "CULTURAL", label: "Cultural Club" },
  { code: "EVENT", label: "Event Committee" },
  { code: "PHD", label: "PHD Committee" },
  { code: "PULSE", label: "Pulse Club" },
  { code: "RESEARCH", label: "Research Club" },
  { code: "SPORTS", label: "Sports Club" },
] as const;

export type ClubSectionCode = (typeof CLUB_SECTIONS)[number]["code"];

export function getClubLabel(code: string): string {
  return CLUB_SECTIONS.find((c) => c.code === code)?.label ?? code;
}
