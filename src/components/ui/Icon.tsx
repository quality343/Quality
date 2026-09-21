const ICONS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M6 6l12 12M6 18L18 6",
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  "calendar": "M8 7V3m8 4V3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  "phone": "M4 5c0-1.1.9-2 2-2h2l2 5-2.5 1.5a12 12 0 0 0 5 5L14 12l5 2v2a2 2 0 0 1-2 2A14 14 0 0 1 4 5Z",
  "map-pin": "M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ear: "M9 18a3 3 0 0 0 3-3V9a5 5 0 1 1 10 0c0 2-.5 3.5-1.5 5M9 18c-1.5 0-3-1-3-3",
  mail: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 1 8 6 8-6",
  clock: "M12 7v5l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  check: "M5 13l4 4L19 7",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z",
  heart: "M12 20s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20 4 22.5 7.5 21 11c-2 4.5-9 9-9 9Z",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m19 0v-1a4 4 0 0 0-3-3.87M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  building: "M6 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M4 20h16M9 8h2m-2 4h2m-2 4h2m4-8h1m-1 4h1m-1 4h1",
  sparkles: "M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4Z",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 9a2 2 0 1 0 4 0",
  home: "M3 11l9-8 9 8m-2 1v8a1 1 0 0 1-1 1h-4v-6h-4v6H6a1 1 0 0 1-1-1v-8",
  clipboard:
    "M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1ZM6 6h2m8 0h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 7h6m-6 4h4",
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
