import type { AgeBand } from "../lib/types";

export const fonts = {
  roundBold: "Fredoka_700Bold",
  roundSemi: "Fredoka_600SemiBold",
  body: "Nunito_600SemiBold",
  bodyBold: "Nunito_800ExtraBold",
  techBold: "SpaceGrotesk_700Bold",
  techSemi: "SpaceGrotesk_600SemiBold",
} as const;

export interface AgeTheme {
  band: AgeBand;
  /** Friendly name for this age group, shown to the child. */
  clubName: string;
  dark: boolean;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  bodyBoldFont: string;
  headingSize: number;
  bodySize: number;
  /** Minimum height for tappable controls. Bigger for little hands. */
  touchSize: number;
  radius: number;
  scene: "rainbow" | "sky" | "space";
  rewardName: string;
  /** Little children can't type yet, so the text box is hidden for 3–5. */
  showTypeBox: boolean;
  speechRate: number;
  speechPitch: number;
}

export const ageThemes: Record<AgeBand, AgeTheme> = {
  "3-5": {
    band: "3-5",
    clubName: "Tiny Champs",
    dark: false,
    background: "#FFF1A8",
    surface: "#FFFFFF",
    text: "#1B2A4A",
    mutedText: "#44516B",
    primary: "#FF6B6B",
    onPrimary: "#FFFFFF",
    secondary: "#74C0FC",
    onSecondary: "#1B2A4A",
    accent: "#FFC21A",
    border: "#FFFFFF",
    headingFont: fonts.roundBold,
    bodyFont: fonts.roundSemi,
    bodyBoldFont: fonts.roundBold,
    headingSize: 34,
    bodySize: 24,
    touchSize: 84,
    radius: 28,
    scene: "rainbow",
    rewardName: "star",
    showTypeBox: false,
    speechRate: 0.85,
    speechPitch: 1.15,
  },
  "6-8": {
    band: "6-8",
    clubName: "Curious Champs",
    dark: false,
    background: "#DCEFFF",
    surface: "#FFFFFF",
    text: "#1B2A4A",
    mutedText: "#44516B",
    primary: "#FF8A3D",
    onPrimary: "#1B2A4A",
    secondary: "#1B2A4A",
    onSecondary: "#FFFFFF",
    accent: "#FFC21A",
    border: "#C9D8EC",
    headingFont: fonts.roundSemi,
    bodyFont: fonts.body,
    bodyBoldFont: fonts.bodyBold,
    headingSize: 26,
    bodySize: 17,
    touchSize: 56,
    radius: 20,
    scene: "sky",
    rewardName: "sticker",
    showTypeBox: true,
    speechRate: 0.95,
    speechPitch: 1.05,
  },
  "9-12": {
    band: "9-12",
    clubName: "Explorers",
    dark: true,
    background: "#0F172A",
    surface: "#1E293B",
    text: "#F1F5F9",
    mutedText: "#CBD5E1",
    primary: "#2DD4BF",
    onPrimary: "#0F172A",
    secondary: "#A78BFA",
    onSecondary: "#0F172A",
    accent: "#FBBF24",
    border: "#334155",
    headingFont: fonts.techBold,
    bodyFont: fonts.body,
    bodyBoldFont: fonts.bodyBold,
    headingSize: 28,
    bodySize: 15,
    touchSize: 48,
    radius: 16,
    scene: "space",
    rewardName: "XP",
    showTypeBox: true,
    speechRate: 1,
    speechPitch: 1,
  },
};

/** Calm, neutral look for parent-facing screens. */
export const parentTheme = {
  background: "#F4F6FA",
  surface: "#FFFFFF",
  text: "#1B2A4A",
  mutedText: "#44516B",
  primary: "#1B2A4A",
  onPrimary: "#FFFFFF",
  accent: "#0F766E",
  border: "#C9D8EC",
  warnBg: "#FFF4E5",
  warnTag: "#FED7AA",
  warnText: "#7C2D12",
} as const;

export const topicColors: Record<string, string> = {
  animals: "#8CE99A",
  space: "#C0B0FF",
  weather: "#74C0FC",
  body: "#FFA8A8",
  ocean: "#66D9E8",
  plants: "#B2F2BB",
};
