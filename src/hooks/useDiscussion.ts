import { Discussion } from "@/types/discussion";
import { useState } from "react";

export function useDiscussion() {
  const [status, setStatus] = useState<Discussion["status"]>("paused");

  return {
    status,
    setStatus
  };
} 