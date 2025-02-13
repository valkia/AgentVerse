import { AgentMessage, NormalMessage } from "@/types/discussion";

export const filterNormalMessages = (
  messages: AgentMessage[]
): NormalMessage[] => {
  return messages.filter((m) => m.type !== "action_result");
};
