import { agentsResource } from "@/resources";
import { agentService } from "@/services/agent.service";
import { Agent } from "@/types/agent";
import { useMemoizedFn } from "ahooks";
import { useState } from "react";
import { useRequest } from "./useRequest";

interface UseAgentsProps {
  onChange?: (agents: Agent[]) => void;
}

export function useAgents({ onChange }: UseAgentsProps = {}) {
  const initialAgents = agentsResource.list.read();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const { loading, error, withLoading } = useRequest({
    // 对于列表数据，我们可以设置更短的防抖时间
    debounceTime: 500,
    minLoadingTime: 300,
  });

  const updateAgentsWithCallback = useMemoizedFn((newAgents: Agent[]) => {
    setAgents(newAgents);
    onChange?.(newAgents);
  });

  const refreshAgents = useMemoizedFn(() => {
    return agentService.listAgents().then((data) => {
      updateAgentsWithCallback(data);
      return data;
    });
  });

  const addAgent = useMemoizedFn(() => {
    const newAgent = agentService.createDefaultAgent();
    return withLoading(
      agentService.createAgent(newAgent).then(() => refreshAgents())
    );
  });

  const updateAgent = useMemoizedFn((id: string, data: Partial<Agent>) => {
    return withLoading(
      agentService.updateAgent(id, data).then(() => refreshAgents())
    );
  });

  const deleteAgent = useMemoizedFn((id: string) => {
    return withLoading(
      agentService.deleteAgent(id).then(() => refreshAgents())
    );
  });

  const toggleAutoReply = useMemoizedFn((id: string, isAutoReply: boolean) => {
    return withLoading(
      agentService.toggleAutoReply(id, isAutoReply).then(() => refreshAgents())
    );
  });

  const getAgentName = useMemoizedFn((id: string) => {
    return agents.find((agent) => agent.id === id)?.name || "未知";
  });

  const getAgentAvatar = useMemoizedFn((id: string) => {
    return agents.find((agent) => agent.id === id)?.avatar || "";
  });

  return {
    agents,
    loading,
    error,
    addAgent,
    updateAgent,
    deleteAgent,
    toggleAutoReply,
    getAgentName,
    getAgentAvatar,
  };
}
