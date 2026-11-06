// Mirrors server/src/types.ts. Keep the two in sync.

export const AGE_BANDS = ["3-5", "6-8", "9-12"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const MEDIA_TOPICS = [
  "sky",
  "space",
  "animals",
  "ocean",
  "weather",
  "plants",
  "body",
  "earth",
  "science",
  "feelings",
  "general",
] as const;
export type MediaTopic = (typeof MEDIA_TOPICS)[number];

export type AnswerKind = "answer" | "gentle" | "redirect" | "personal_info";

export interface AskResponse {
  kind: AnswerKind;
  answer: string;
  funFact: string | null;
  steps: string[];
  followUps: string[];
  mediaTopic: MediaTopic;
  flagForParent: boolean;
  source: "online" | "offline";
}
