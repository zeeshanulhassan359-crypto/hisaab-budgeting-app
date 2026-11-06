// Shared contract between the server and the app (the app mirrors this in src/lib/types.ts).

export const AGE_BANDS = ["3-5", "6-8", "9-12"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

// The model may only pick one of these tags. The app maps each tag to a
// picture that a person has already checked, so the model never chooses
// an image or video itself.
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

export type AnswerKind =
  | "answer" // normal, checked answer
  | "gentle" // sensitive topic, answered gently with a nudge to talk to a grown-up
  | "redirect" // unsafe or out-of-scope question, kind redirect instead of an answer
  | "personal_info"; // the child shared personal details; we did not send them anywhere

export interface AskRequest {
  question: string;
  ageBand: AgeBand;
}

export interface AskResponse {
  kind: AnswerKind;
  answer: string;
  funFact: string | null;
  steps: string[];
  followUps: string[];
  mediaTopic: MediaTopic;
  /** True when a parent should see this question highlighted in the Parent zone. */
  flagForParent: boolean;
  source: "online" | "offline";
}
