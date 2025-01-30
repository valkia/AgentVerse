import { createResource } from "@/lib/resource";
import { agentService } from "@/services/agent.service";
import { DEFAULT_AGENTS } from "@/config/agents";

// 应用级资源
export const agentListResource = createResource(
  agentService.listAgents().then(agents => {
    if (agents.length === 0) {
      return Promise.all(
        DEFAULT_AGENTS.map(agent => agentService.createAgent(agent))
      );
    }
    return agents;
  })
);

// 按领域组织资源
export const agentsResource = {
  // 主列表资源
  list: agentListResource,
  
  // 为未来扩展预留位置
  // byId: (id: string) => createResource(agentService.getAgent(id)),
  // settings: createResource(agentService.getSettings()),
}; 