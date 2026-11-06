import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  CLASSIFIER_SYSTEM_PROMPT,
  REVIEWER_SYSTEM_PROMPT,
  answerSystemPrompt,
} from "./prompts.js";
import { cannedResponse, containsPersonalInfo, outputLooksUnsafe } from "./localChecks.js";
import { MEDIA_TOPICS, type AgeBand, type AskResponse } from "./types.js";

// Both default to the current Opus. Set SAFETY_MODEL (and optionally
// ANSWER_MODEL) to claude-haiku-5-5 to cut cost once you have measured quality.
const ANSWER_MODEL = process.env.ANSWER_MODEL ?? "claude-opus-5-5";
const SAFETY_MODEL = process.env.SAFETY_MODEL ?? "claude-opus-5-5";

// If a model declines on safety grounds, the API retries on a suitable
// fallback model inside the same call. If the whole chain declines, we show
// a kind redirect instead.
function fallbackParams(): { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: "default" } {
  return { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
}

const client = new Anthropic();

const ClassificationSchema = z.object({
  category: z.enum(["ok", "sensitive", "disclosure", "personal_info", "unsafe"]),
  mediaTopic: z.enum(MEDIA_TOPICS),
});

const AnswerSchema = z.object({
  answer: z.string(),
  funFact: z.string().nullable(),
  steps: z.array(z.string()),
  followUps: z.array(z.string()),
  mediaTopic: z.enum(MEDIA_TOPICS),
  flagForParent: z.boolean(),
});

const ReviewSchema = z.object({
  safe: z.boolean(),
  ageAppropriate: z.boolean(),
  reason: z.string(),
});

function asData(question: string, ageBand: AgeBand): string {
  return `Age group: ${ageBand}\n<child_question>\n${question}\n</child_question>`;
}

async function classify(question: string, ageBand: AgeBand) {
  const response = await client.beta.messages.parse({
    ...fallbackParams(),
    model: SAFETY_MODEL,
    max_tokens: 2000,
    system: CLASSIFIER_SYSTEM_PROMPT,
    output_config: { effort: "low", format: betaZodOutputFormat(ClassificationSchema) },
    messages: [{ role: "user", content: asData(question, ageBand) }],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output;
}

async function writeAnswer(question: string, ageBand: AgeBand, sensitive: boolean) {
  const note = sensitive
    ? "\n\nThe safety screen marked this question as sensitive: answer with extra gentleness and set flagForParent to true."
    : "";
  const response = await client.beta.messages.parse({
    ...fallbackParams(),
    model: ANSWER_MODEL,
    max_tokens: 4000,
    system: [
      { type: "text", text: answerSystemPrompt(ageBand), cache_control: { type: "ephemeral" } },
    ],
    output_config: { effort: "medium", format: betaZodOutputFormat(AnswerSchema) },
    messages: [{ role: "user", content: asData(question, ageBand) + note }],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output;
}

async function review(question: string, ageBand: AgeBand, answerText: string) {
  const response = await client.beta.messages.parse({
    ...fallbackParams(),
    model: SAFETY_MODEL,
    max_tokens: 2000,
    system: REVIEWER_SYSTEM_PROMPT,
    output_config: { effort: "low", format: betaZodOutputFormat(ReviewSchema) },
    messages: [
      {
        role: "user",
        content: `${asData(question, ageBand)}\n<proposed_answer>\n${answerText}\n</proposed_answer>`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output;
}

export type Logger = (event: string, detail?: Record<string, unknown>) => void;

/**
 * Three layers: screen the question, write an age-matched answer, then review
 * that answer. Any failure at any layer falls back to a safe canned reply.
 * The child's question text is never logged.
 */
export async function answerQuestion(
  question: string,
  ageBand: AgeBand,
  log: Logger,
): Promise<AskResponse> {
  if (containsPersonalInfo(question)) {
    log("blocked_personal_info_local");
    return cannedResponse("personal_info", ageBand);
  }

  const classification = await classify(question, ageBand);
  if (!classification) {
    log("classifier_refused");
    return cannedResponse("redirect", ageBand);
  }
  log("classified", { category: classification.category });

  switch (classification.category) {
    case "unsafe":
      return cannedResponse("redirect", ageBand);
    case "personal_info":
      return cannedResponse("personal_info", ageBand);
    case "disclosure":
      // A child in distress gets a fixed, reviewed message, never generated text.
      return cannedResponse("disclosure", ageBand);
  }

  const sensitive = classification.category === "sensitive";
  const draft = await writeAnswer(question, ageBand, sensitive);
  if (!draft) {
    log("answer_refused");
    return cannedResponse("redirect", ageBand);
  }

  const shownText = [draft.answer, draft.funFact ?? "", ...draft.steps, ...draft.followUps].join("\n");
  if (outputLooksUnsafe(shownText)) {
    log("blocked_output_local");
    return cannedResponse("unavailable", ageBand);
  }

  const verdict = await review(question, ageBand, shownText);
  if (!verdict || !verdict.safe || !verdict.ageAppropriate) {
    log("blocked_output_review", { reason: verdict?.reason ?? "review_refused" });
    return cannedResponse("unavailable", ageBand);
  }

  return {
    kind: sensitive ? "gentle" : "answer",
    answer: draft.answer,
    funFact: draft.funFact,
    steps: draft.steps.slice(0, 3),
    followUps: draft.followUps.slice(0, 2),
    mediaTopic: draft.mediaTopic,
    flagForParent: sensitive || draft.flagForParent,
    source: "online",
  };
}
