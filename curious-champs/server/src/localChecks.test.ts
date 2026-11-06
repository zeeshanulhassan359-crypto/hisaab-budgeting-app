import { test } from "node:test";
import assert from "node:assert/strict";
import { cannedResponse, cleanQuestion, containsPersonalInfo, outputLooksUnsafe } from "./localChecks.js";

test("detects personal details before anything is sent", () => {
  assert.equal(containsPersonalInfo("my email is sam@example.com"), true);
  assert.equal(containsPersonalInfo("call me on 0300 123 4567"), true);
  assert.equal(containsPersonalInfo("I live at 12 Park Road"), true);
  assert.equal(containsPersonalInfo("my password is tiger"), true);
});

test("ordinary questions pass, including ones with numbers", () => {
  assert.equal(containsPersonalInfo("Why is the sky blue?"), false);
  assert.equal(containsPersonalInfo("Is 1000 bigger than 100?"), false);
  assert.equal(containsPersonalInfo("How far away is the moon in km?"), false);
});

test("cleans whitespace and control characters", () => {
  assert.equal(cleanQuestion("  why\n\tdo   cats purr?\u0007 "), "why do cats purr?");
});

test("blocks links and contact details in answers", () => {
  assert.equal(outputLooksUnsafe("Visit www.example.com to learn more"), true);
  assert.equal(outputLooksUnsafe("Ask a grown-up to help you look it up."), false);
});

test("canned disclosure reply is gentle and flags the parent", () => {
  const reply = cannedResponse("disclosure", "6-8");
  assert.equal(reply.kind, "gentle");
  assert.equal(reply.flagForParent, true);
  assert.match(reply.answer, /grown-up/);
});
