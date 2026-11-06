import type { AgeBand, AskResponse } from "./types.js";

export const MAX_QUESTION_LENGTH = 300;

// Fast checks that run before anything leaves this server. They catch
// personal details so those details are never sent to the AI service.
const PERSONAL_INFO_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // email address
  /(?:\+?\d[\s-]?){10,}/, // phone-like number (10+ digits)
  /\b\d{1,5}\s+\w+(?:\s\w+)?\s+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|block|sector)\b/i, // street address
  /\bmy (?:password|passcode|pin)\b/i,
];

export function containsPersonalInfo(question: string): boolean {
  return PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(question));
}

/** Trim, collapse whitespace and strip control characters. */
export function cleanQuestion(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type CannedKind = "personal_info" | "redirect" | "disclosure" | "unavailable";

const CANNED: Record<CannedKind, Record<AgeBand, string>> = {
  personal_info: {
    "3-5": "Oops! That is private. Let's keep it secret-safe with your grown-up. What else do you want to know?",
    "6-8": "That looks like private information, like a phone number or address. Champ doesn't need it, so let's keep it safe. Ask me something else you're curious about!",
    "9-12": "That looks like personal information (like a phone number, address, or password). Champ never needs it, and it's best not to share it online. What else would you like to figure out?",
  },
  redirect: {
    "3-5": "That's a question for your grown-up. Let's ask about animals, space, or rainbows!",
    "6-8": "That's a really good one to ask a grown-up you trust. Want to ask Champ about animals, space, or how things work?",
    "9-12": "That's a question best talked about with a parent or another grown-up you trust. Champ can help with science, nature, space, history and lots more!",
  },
  disclosure: {
    "3-5": "Thank you for telling me. Please go and tell your grown-up right now. You are not in trouble.",
    "6-8": "Thank you for telling me. It's not your fault. Please tell a grown-up you trust right now, like a parent or teacher. They can help you.",
    "9-12": "Thank you for telling me, that took courage. It's not your fault. Please talk to a grown-up you trust right away, like a parent, teacher, or school counsellor. They can help in ways Champ can't.",
  },
  unavailable: {
    "3-5": "Champ is thinking too hard! Let's try again in a little bit.",
    "6-8": "Hmm, Champ couldn't find a good answer right now. Let's try again in a little bit, or ask a grown-up!",
    "9-12": "Champ couldn't put together a checked answer right now. Try again in a moment, or explore this one with a grown-up.",
  },
};

export function cannedResponse(kind: CannedKind, ageBand: AgeBand): AskResponse {
  return {
    kind: kind === "personal_info" ? "personal_info" : kind === "disclosure" ? "gentle" : "redirect",
    answer: CANNED[kind][ageBand],
    funFact: null,
    steps: [],
    followUps: [],
    mediaTopic: kind === "disclosure" ? "feelings" : "general",
    flagForParent: kind === "disclosure" || kind === "redirect",
    source: "online",
  };
}

/** Last-line output filter: anything link-like or contact-like is never shown. */
export function outputLooksUnsafe(text: string): boolean {
  return /(https?:\/\/|www\.|\.com\b|\.org\b|@\w)/i.test(text) || containsPersonalInfo(text);
}
