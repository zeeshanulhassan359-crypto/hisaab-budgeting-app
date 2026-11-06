import type { AgeBand, AskResponse, MediaTopic } from "./types";

// Answers written and checked by a person ahead of time, shipped inside the
// app so popular questions work with no internet. Add more packs here.

interface PackAnswer {
  answer: string;
  funFact: string | null;
  steps?: string[];
}

interface PackEntry {
  id: string;
  /** All words in at least one group must appear in the question. */
  match: string[][];
  mediaTopic: MediaTopic;
  answers: Record<AgeBand, PackAnswer>;
  followUps: string[];
}

const PACK: PackEntry[] = [
  {
    id: "sky-blue",
    match: [["sky", "blue"]],
    mediaTopic: "sky",
    followUps: ["Why are sunsets orange?", "Why are clouds white?"],
    answers: {
      "3-5": { answer: "Sunshine bounces all around the sky, and blue bounces the most!", funFact: null },
      "6-8": {
        answer:
          "Sunlight looks white, but it is really all the colours mixed together. When it zooms into the air, the blue light bumps into tiny bits of air and bounces all over the sky. So everywhere you look up, you see blue!",
        funFact: "At sunset the sky turns orange because the light travels a longer way to reach you.",
      },
      "9-12": {
        answer:
          "Sunlight is a mix of every colour, and each colour travels as a wave. Blue light has short, choppy waves, so it bumps into the tiny gas molecules in the air and gets scattered across the whole sky. Scientists call this Rayleigh scattering, which just means light bouncing off particles much smaller than its wavelength.",
        funFact: "On Mars the daytime sky looks butterscotch, and sunsets there look blue.",
        steps: ["Sunlight enters the air", "Blue light scatters off molecules", "Blue reaches your eyes from everywhere"],
      },
    },
  },
  {
    id: "rain",
    match: [["rain"]],
    mediaTopic: "weather",
    followUps: ["What makes thunder?", "Why do rainbows appear after rain?"],
    answers: {
      "3-5": { answer: "The sun warms water, it floats up to make clouds, and when clouds get full, the water falls as rain!", funFact: null },
      "6-8": {
        answer:
          "The sun warms water in seas, lakes and puddles, and it rises into the sky as an invisible gas. High up it cools into tiny drops that make clouds. When the drops join together and get too heavy, they fall back down as rain.",
        funFact: "The water you drink may once have been rain that fell on dinosaurs.",
      },
      "9-12": {
        answer:
          "Rain is one stage of the water cycle. Heat from the sun causes evaporation, turning liquid water into water vapour. As the vapour rises it cools and condenses onto dust specks, forming cloud droplets. Droplets collide and merge until they are heavy enough to fall as precipitation.",
        funFact: "A typical raindrop is shaped more like a small bun than a teardrop.",
        steps: ["Water evaporates", "Vapour cools and condenses into clouds", "Heavy drops fall as rain"],
      },
    },
  },
  {
    id: "cats-purr",
    match: [["cat", "purr"], ["cats", "purr"]],
    mediaTopic: "animals",
    followUps: ["Why do dogs wag their tails?", "Can big cats like lions purr?"],
    answers: {
      "3-5": { answer: "Cats purr when they feel happy and cosy, like a little humming hug!", funFact: null },
      "6-8": {
        answer:
          "Cats purr by quickly moving tiny muscles in their throat while they breathe in and out. They usually purr when they feel happy and safe. Sometimes they also purr to calm themselves down when they feel poorly.",
        funFact: "A cat's purr can be heard while it is breathing in and breathing out.",
      },
      "9-12": {
        answer:
          "A purr is made when muscles in a cat's larynx, or voice box, twitch many times each second, making the vocal folds buzz as air moves in and out. Cats purr when content, but also when stressed or hurt, so scientists think purring may help them soothe themselves.",
        funFact: "Cheetahs can purr, but lions and tigers roar instead.",
        steps: ["The brain sends a rhythm signal", "Throat muscles twitch quickly", "Air passing through makes the buzz"],
      },
    },
  },
  {
    id: "moon-far",
    match: [["moon", "far"], ["moon", "away"]],
    mediaTopic: "space",
    followUps: ["Why does the moon change shape?", "Has anyone walked on the moon?"],
    answers: {
      "3-5": { answer: "The moon is very, very far away. A car would need months and months to drive there!", funFact: null },
      "6-8": {
        answer:
          "The moon is about 384,000 kilometres away. If you could drive a car there without stopping, it would take around half a year. Astronauts in a rocket got there in about three days!",
        funFact: "The moon is slowly drifting away from Earth, about 4 centimetres every year.",
      },
      "9-12": {
        answer:
          "On average the moon is about 384,400 km from Earth. Its orbit is an ellipse, a slightly stretched circle, so the distance changes by tens of thousands of kilometres each month. Light from the moon takes a little over one second to reach your eyes.",
        funFact: "Scientists measure the moon's distance by bouncing lasers off mirrors astronauts left there.",
      },
    },
  },
  {
    id: "rainbow",
    match: [["rainbow"]],
    mediaTopic: "weather",
    followUps: ["Why is the sky blue?", "Can you ever reach the end of a rainbow?"],
    answers: {
      "3-5": { answer: "When sunshine shines through raindrops, the light splits into lots of colours. That's a rainbow!", funFact: null },
      "6-8": {
        answer:
          "Sunlight is made of many colours mixed together. When it shines through raindrops, each drop bends the light and splits it into red, orange, yellow, green, blue and purple. You see a rainbow when the sun is behind you and rain is in front of you.",
        funFact: "From an aeroplane you can sometimes see a rainbow as a full circle.",
      },
      "9-12": {
        answer:
          "A rainbow forms when sunlight enters raindrops, bends (refraction), reflects off the back of the drop, and bends again on the way out. Each colour bends by a slightly different amount, so white light fans out into a spectrum. That is why the sun must be behind you to see one.",
        funFact: "Every person sees their own rainbow, made by a different set of raindrops.",
        steps: ["Light bends entering a drop", "It reflects off the back", "Colours spread out as it leaves"],
      },
    },
  },
  {
    id: "stars-twinkle",
    match: [["star", "twinkle"], ["stars", "twinkle"]],
    mediaTopic: "space",
    followUps: ["What is a star made of?", "Is the sun a star?"],
    answers: {
      "3-5": { answer: "Starlight wiggles through the moving air on its way to us, so stars look like they twinkle!", funFact: null },
      "6-8": {
        answer:
          "Stars are giant balls of hot, glowing gas very far away. Their light has to travel through the air around Earth, which is always moving. The moving air wobbles the light, so the stars look like they are twinkling.",
        funFact: "Astronauts in space see stars shine steadily, without twinkling.",
      },
      "9-12": {
        answer:
          "Twinkling, called scintillation, happens because Earth's atmosphere has pockets of air at different temperatures that bend light by different amounts. Stars are so far away they look like tiny points, so these shifting pockets make their brightness and position flicker. Planets look like small discs and usually twinkle less.",
        funFact: "Big telescopes use mirrors that change shape hundreds of times a second to cancel twinkling.",
      },
    },
  },
  {
    id: "why-sleep",
    match: [["why", "sleep"]],
    mediaTopic: "body",
    followUps: ["Why do we dream?", "Do animals sleep too?"],
    answers: {
      "3-5": { answer: "Sleep helps your body grow and gives your brain a rest, so you feel happy and strong!", funFact: null },
      "6-8": {
        answer:
          "When you sleep, your body grows and fixes itself, and your brain sorts out everything you learned during the day. That's why you feel brighter and happier after a good night's sleep. Children need more sleep than grown-ups because they are growing.",
        funFact: "Giraffes can get by on less than five hours of sleep a day.",
      },
      "9-12": {
        answer:
          "During sleep your body releases growth hormone, repairs muscles, and supports your immune system. Your brain also strengthens new memories, moving the day's learning into long-term storage, and clears away waste chemicals. Most 9 to 12 year olds need around 9 to 12 hours a night to feel and think their best.",
        funFact: "Dolphins sleep with one half of their brain at a time.",
      },
    },
  },
  {
    id: "dinosaurs",
    match: [["dinosaur"], ["dinosaurs"]],
    mediaTopic: "animals",
    followUps: ["Which dinosaur was the biggest?", "Are birds related to dinosaurs?"],
    answers: {
      "3-5": { answer: "Dinosaurs lived a long, long time ago. Some were giant, and some were as small as a chicken!", funFact: null },
      "6-8": {
        answer:
          "Dinosaurs were reptiles that lived millions of years ago, long before people. Most of them disappeared after a giant space rock hit the Earth and changed the weather. We learn about them from fossils, which are bones and footprints turned to stone.",
        funFact: "Birds are living relatives of dinosaurs, so a pigeon is a tiny dino cousin!",
      },
      "9-12": {
        answer:
          "Dinosaurs ruled the land for about 165 million years. Around 66 million years ago, an asteroid about 10 km wide struck what is now Mexico, throwing dust into the sky that blocked sunlight and caused a mass extinction. Palaeontologists, scientists who study fossils, piece together their story from bones, teeth, eggs and footprints.",
        funFact: "Birds evolved from small feathered dinosaurs, so dinosaurs never fully disappeared.",
      },
    },
  },
];

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean));
}

export function findOfflineAnswer(question: string, ageBand: AgeBand): AskResponse | null {
  const qWords = words(question);
  const entry = PACK.find((e) => e.match.some((group) => group.every((w) => qWords.has(w))));
  if (!entry) return null;
  const a = entry.answers[ageBand];
  return {
    kind: "answer",
    answer: a.answer,
    funFact: a.funFact,
    steps: a.steps ?? [],
    followUps: ageBand === "3-5" ? [] : entry.followUps,
    mediaTopic: entry.mediaTopic,
    flagForParent: false,
    source: "offline",
  };
}

export const OFFLINE_SUGGESTIONS = [
  "Why is the sky blue?",
  "Where does rain come from?",
  "Why do cats purr?",
  "How far away is the moon?",
  "How do rainbows happen?",
  "Why do stars twinkle?",
];

export const OFFLINE_PACK_NAMES = ["Sky & weather", "Animals", "Space", "My body"];
