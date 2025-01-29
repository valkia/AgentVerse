import { useState, useCallback } from "react";
import { Agent } from "@/types/agent";
import { nanoid } from "nanoid";
import { DEFAULT_AGENTS } from "@/config/agents";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(
    DEFAULT_AGENTS.map((agent) => ({
      ...agent,
      id: nanoid(),
    }))
  );

  const addAgent = useCallback(() => {
    const newAgent: Omit<Agent, "id"> = {
      name: `新成员 ${agents.length + 1}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
      prompt: "请在编辑时设置该成员的具体职责和行为方式。",
      role: "participant",
      personality: "待设置",
      expertise: [],
      bias: "待设置",
      responseStyle: "待设置",
      isAutoReply: true,
    };

    setAgents((prev) => [{ ...newAgent, id: nanoid() }, ...prev]);
  }, [agents.length]);

  const updateAgent = useCallback((agentId: string, agentData: Partial<Omit<Agent, "id">>) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, ...agentData } : agent
      )
    );
  }, []);

  const deleteAgent = useCallback((agentId: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
  }, []);

  const toggleAutoReply = useCallback((agentId: string, isAutoReply: boolean) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, isAutoReply } : agent
      )
    );
  }, []);

  const getAgentName = useCallback((agentId: string) => {
    return agents.find((agent) => agent.id === agentId)?.name || "未知";
  }, [agents]);

  const getAgentAvatar = useCallback((agentId: string) => {
    return agents.find((agent) => agent.id === agentId)?.avatar || "";
  }, [agents]);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    toggleAutoReply,
    getAgentName,
    getAgentAvatar,
  };
} 