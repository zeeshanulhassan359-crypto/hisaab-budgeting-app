import type { AgeBand, MediaTopic } from "../lib/types";

// Only videos a person has watched start to finish and approved go here.
// Host them yourself (or with a licensed provider) so there are no ads,
// comments or "recommended" videos. The AI never picks a video: the app
// matches the answer's topic tag to this list.
//
// Example entry (replace with your own approved, hosted file):
// {
//   id: "sky-colours",
//   title: "Colours of the sky",
//   url: "https://your-cdn.example/videos/sky-colours.mp4",
//   minutes: 2,
//   topics: ["sky", "weather"],
//   ages: ["6-8", "9-12"],
// },

export interface ApprovedVideo {
  id: string;
  title: string;
  url: string;
  minutes: number;
  topics: MediaTopic[];
  ages: AgeBand[];
}

export const APPROVED_VIDEOS: ApprovedVideo[] = [];

export function findApprovedVideo(topic: MediaTopic, ageBand: AgeBand): ApprovedVideo | null {
  return APPROVED_VIDEOS.find((v) => v.topics.includes(topic) && v.ages.includes(ageBand)) ?? null;
}
