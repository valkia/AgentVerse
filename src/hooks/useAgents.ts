import { agentsResource } from "@/resources";
import { agentService } from "@/services/agent.service";
import { Agent } from "@/types/agent";
import { useMemoizedFn } from "ahooks";
import { useResourceState } from "@/lib/resource";
import { useOptimisticUpdate } from "./useOptimisticUpdate";
import { useEffect, useState } from "react";

interface UseAgentsProps {
  onChange?: (agents: Agent[]) => void;
}

export function useAgents({ onChange }: UseAgentsProps = {}) {
  const resource = useResourceState(agentsResource.list);
  const { data: agents } = resource;
  const [isLoading, setIsLoading] = useState(true);

  const withOptimisticUpdate = useOptimisticUpdate(resource, { onChange });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const agents = await agentService.initialize();
      setIsLoading(false);
      return agents;
    } catch (error) {
      console.error("Error loading agents:", error);
      setIsLoading(false);
      return [];
    }
  };

  const addAgent = useMemoizedFn(async () => {
    const defaultAgent = agentService.createDefaultAgent();
    const seed = `agent${Date.now().toString().slice(-4)}`;
    defaultAgent.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    
    return withOptimisticUpdate(
      // 乐观更新
      (agents) => [...agents, { ...defaultAgent, id: `temp-${seed}` }],
      // API 调用
      () => agentService.createAgent(defaultAgent)
    );
  });

  const updateAgent = useMemoizedFn(async (id: string, data: Partial<Agent>) => {
    return withOptimisticUpdate(
      // 乐观更新
      (agents) => agents.map((a) => (a.id === id ? { ...a, ...data } : a)),
      // API 调用
      () => agentService.updateAgent(id, data)
    );
  });

  const deleteAgent = useMemoizedFn(async (id: string) => {
    return withOptimisticUpdate(
      // 乐观更新
      (agents) => agents.filter((a) => a.id !== id),
      // API 调用
      () => agentService.deleteAgent(id)
    );
  });

  const getAgentName = useMemoizedFn((id: string) => {
    return agents.find((agent) => agent.id === id)?.name ?? "未知";
  });

  const getAgentAvatar = useMemoizedFn((id: string) => {
    return agents.find((agent) => agent.id === id)?.avatar ?? "";
  });

  return {
    agents,
    isLoading,
    error: resource.error,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgentName,
    getAgentAvatar
  };
}
