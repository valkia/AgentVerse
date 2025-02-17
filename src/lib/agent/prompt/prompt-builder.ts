import { ChatMessage } from "@/lib/ai-service";
import { Capability } from "@/lib/capabilities";
import { Agent } from "@/types/agent";
import {
  ActionResultMessage,
  AgentMessage,
  NormalMessage,
} from "@/types/discussion";
import {
  createRolePrompt,
  formatActionResult,
  formatMessage,
  generateCapabilityPrompt,
} from "./prompts";
import { IAgentConfig } from "@/lib/agent";

export class PromptBuilder {
  buildPrompt(context: {
    currentAgent: Agent;
    currentAgentConfig: IAgentConfig;
    agents: Agent[];
    messages: AgentMessage[];
    triggerMessage?: NormalMessage | ActionResultMessage;
    capabilities: Capability[];
  }): ChatMessage[] {
    const {
      currentAgent,
      currentAgentConfig,
      agents,
      messages,
      capabilities,
      triggerMessage,
    } = context;
    const systemPromptList = [
      createRolePrompt(currentAgent, agents),
      currentAgent.role === "moderator"
        ? generateCapabilityPrompt(capabilities)
        : "",
    ].filter(Boolean);

    const systemPrompt = systemPromptList.join("\n\n");

    const getAgentName = (agentId: string) => {
      const agent = agents.find((agent) => agent.id === agentId);
      return agent?.name ?? agentId;
    };

    // 处理历史消息
    const chatMessages = messages
      .slice(-(currentAgentConfig.conversation?.contextMessages ?? 10))
      .map((msg) => {
        if (msg.type === "action_result") {
          return {
            role: "system" as const,
            content: formatActionResult(msg.results),
          };
        }

        return {
          role: "system" as const,
          content: formatMessage(
            (msg as NormalMessage).content,
            msg.agentId === currentAgentConfig.agentId,
            getAgentName(msg.agentId)
          ),
        };
      });

    // 添加当前消息
    if (triggerMessage) {
      if (triggerMessage.type === "action_result") {
        chatMessages.push({
          role: "system" as const,
          content: formatActionResult(triggerMessage.results),
        });
      } else {
        chatMessages.push({
          role: "system" as const,
          content: formatMessage(
            triggerMessage.content,
            triggerMessage.agentId === currentAgentConfig.agentId,
            getAgentName(triggerMessage.agentId)
          ),
        });
      }
    }

    return [{ role: "system", content: systemPrompt }, ...chatMessages];
  }
}
