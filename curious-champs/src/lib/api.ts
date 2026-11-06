import Constants from "expo-constants";
import { findOfflineAnswer } from "./offlinePack";
import type { AgeBand, AskResponse } from "./types";

const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "http://localhost:8787";

const TIMEOUT_MS = 30_000;

// Personal details never leave the phone. Mirrors the server's own check.
const PERSONAL_INFO = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  /(?:\+?\d[\s-]?){10,}/,
  /\b\d{1,5}\s+\w+(?:\s\w+)?\s+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|block|sector)\b/i,
  /\bmy (?:password|passcode|pin)\b/i,
];

const PRIVATE_REPLY: Record<AgeBand, string> = {
  "3-5": "Oops! That is private. Let's keep it safe with your grown-up. What else do you want to know?",
  "6-8": "That looks like private information, like a phone number or address. Champ doesn't need it, so let's keep it safe. Ask me something else!",
  "9-12": "That looks like personal information. Champ never needs it, and it's best not to share it online. What else would you like to figure out?",
};

const OFFLINE_REPLY: Record<AgeBand, string> = {
  "3-5": "Champ needs the internet for this one. Let's ask again later!",
  "6-8": "Champ needs the internet to answer this one. Let's ask again when we're online, or try a question from the topic packs!",
  "9-12": "This one needs an internet connection. Save it for later, or try a question from your offline topic packs.",
};

export function hasPersonalInfo(question: string): boolean {
  return PERSONAL_INFO.some((p) => p.test(question));
}

function local(ageBand: AgeBand, answer: string, kind: AskResponse["kind"]): AskResponse {
  return { kind, answer, funFact: null, steps: [], followUps: [], mediaTopic: "general", flagForParent: false, source: "offline" };
}

function isAskResponse(value: unknown): value is AskResponse {
  const v = value as Partial<AskResponse> | null;
  return !!v && typeof v.answer === "string" && typeof v.kind === "string" && Array.isArray(v.steps);
}

/**
 * Ask the safety server. If the phone is offline or the server is down, use
 * the checked answers bundled in the app.
 */
export async function askQuestion(question: string, ageBand: AgeBand): Promise<AskResponse> {
  const trimmed = question.trim().slice(0, 300);
  if (hasPersonalInfo(trimmed)) return local(ageBand, PRIVATE_REPLY[ageBand], "personal_info");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.EXPO_PUBLIC_APP_KEY ? { "x-app-key": process.env.EXPO_PUBLIC_APP_KEY } : {}),
      },
      body: JSON.stringify({ question: trimmed, ageBand }),
      signal: controller.signal,
    });
    if (res.ok) {
      const data: unknown = await res.json();
      if (isAskResponse(data)) return { ...data, source: "online" };
    }
  } catch {
    // Offline, timed out, or server unreachable: fall through to the offline pack.
  } finally {
    clearTimeout(timer);
  }

  return findOfflineAnswer(trimmed, ageBand) ?? local(ageBand, OFFLINE_REPLY[ageBand], "redirect");
}
