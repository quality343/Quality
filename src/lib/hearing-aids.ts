/** Human-readable labels for hearing-aid catalogue enums (no invented specs). */

export const DEVICE_TYPE_LABEL: Record<string, string> = {
  BTE: "Behind-the-ear",
  RIC: "Receiver-in-canal",
  ITE: "In-the-ear",
  ITC: "In-the-canal",
  CIC: "Completely-in-canal",
  IIC: "Invisible-in-canal",
};

export const TECH_LEVEL_LABEL: Record<string, string> = {
  PREMIUM: "Premium",
  ADVANCED: "Advanced",
  MID: "Mid-range",
  ESSENTIAL: "Essential",
};

export function deviceTypeLabel(v: string): string {
  return DEVICE_TYPE_LABEL[v] ?? v.replace(/_/g, " ");
}

export function techLevelLabel(v: string): string {
  return TECH_LEVEL_LABEL[v] ?? v.replace(/_/g, " ");
}
