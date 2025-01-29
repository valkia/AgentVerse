import { useState } from "react";
import { Discussion, DiscussionSettings } from "@/types/agent";
import { DEFAULT_SETTINGS } from "@/config/settings";

export function useDiscussion() {
  const [status, setStatus] = useState<Discussion["status"]>("paused");
  const [settings, setSettings] = useState<DiscussionSettings>(DEFAULT_SETTINGS);

  return {
    status,
    setStatus,
    settings,
    setSettings,
  };
} 
