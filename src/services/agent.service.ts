import { DEFAULT_AGENTS } from "@/config/agents";
import { MockHttpProvider } from "@/lib/storage";
import { Agent } from "@/types/agent";
import { AgentDataProvider } from "@/types/storage";

export class AgentService {
  constructor(private readonly provider: AgentDataProvider) {}

  async initialize(): Promise<Agent[]> {
    const agents = await this.listAgents();
    if (agents.length === 0) {
      return Promise.all(
        DEFAULT_AGENTS.map((agent) => this.createAgent(agent))
      );
    }
    return agents;
  }

  async listAgents(): Promise<Agent[]> {
    return this.provider.list();
  }

  async getAgent(id: string): Promise<Agent> {
    return this.provider.get(id);
  }

  async createAgent(data: Omit<Agent, "id">): Promise<Agent> {
    // 这里可以添加业务验证逻辑
    if (!data.name) {
      throw new Error("Agent name is required");
    }

    // 主持人角色的特殊处理
    if (data.role === "moderator") {
      const agents = await this.listAgents();
      if (agents.some((agent) => agent.role === "moderator")) {
        throw new Error("Only one moderator is allowed");
      }
    }

    const result = await this.provider.create(data);
    return result;
  }

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    // 如果要更改角色为主持人，需要检查
    if (data.role === "moderator") {
      const agents = await this.listAgents();
      const currentAgent = await this.getAgent(id);
      if (
        currentAgent.role !== "moderator" &&
        agents.some((agent) => agent.role === "moderator")
      ) {
        throw new Error("Only one moderator is allowed");
      }
    }

    const result = await this.provider.update(id, data);
    return result;
  }

  async deleteAgent(id: string): Promise<void> {
    // 检查是否试图删除主持人
    const agent = await this.getAgent(id);
    if (agent.role === "moderator") {
      throw new Error("Cannot delete the moderator");
    }

    await this.provider.delete(id);
  }
  // 工具方法
  createDefaultAgent(): Omit<Agent, "id"> {
    const seed = Date.now().toString();
    return {
      name: "新成员",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c7f2a4,f4d4d4`,
      prompt: "请在编辑时设置该成员的具体职责和行为方式。",
      role: "participant",
      personality: "待设置",
      expertise: [],
      bias: "待设置",
      responseStyle: "待设置",
    };
  }
}

const createDefaultAgentService = () => {
  return new AgentService(new MockHttpProvider<Agent>("agents", 200));
};

export const agentService = createDefaultAgentService();
