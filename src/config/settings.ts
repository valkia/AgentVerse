import { DiscussionSettings } from "@/types/agent";

export const DEFAULT_SETTINGS: DiscussionSettings = {
  maxRounds: 5,
  temperature: 0.7,
  interval: 3000,
  moderationStyle: "relaxed",
  focusTopics: [],
  allowConflict: true,
} as const; 