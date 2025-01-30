import { DEFAULT_AGENTS } from "@/config/agents";
import { MockHttpProvider } from "@/lib/storage";
import { AgentDataProvider } from "@/lib/storage/types";
import { Agent } from "@/types/agent";
import { ResourceManagerImpl, createResource } from "@/lib/resource";

export class AgentService {
  private readonly resource: ResourceManagerImpl<Agent[]>;

  constructor(private readonly provider: AgentDataProvider) {
    // 使用600ms的最小加载时间，3次重试机制
    this.resource = createResource(this.initialize(), {
      minLoadingTime: 600,
      retryTimes: 3,
      retryDelay: 1000
    });
  }

  // 资源访问方法
  getInitialAgents(): Agent[] {
    return this.resource.read();
  }

  // 重新加载数据
  reloadAgents() {
    this.resource.reload(this.initialize());
  }

  async initialize(): Promise<Agent[]> {
    const agents = await this.listAgents();
    if (agents.length === 0) {
      return Promise.all(
        DEFAULT_AGENTS.map(agent => this.createAgent(agent))
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
    this.reloadAgents(); // 自动重新加载列表
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
    this.reloadAgents(); // 自动重新加载列表
    return result;
  }

  async deleteAgent(id: string): Promise<void> {
    // 检查是否试图删除主持人
    const agent = await this.getAgent(id);
    if (agent.role === "moderator") {
      throw new Error("Cannot delete the moderator");
    }

    await this.provider.delete(id);
    this.reloadAgents(); // 自动重新加载列表
  }

  async toggleAutoReply(id: string, isAutoReply: boolean): Promise<Agent> {
    return this.updateAgent(id, { isAutoReply });
  }

  // 工具方法
  createDefaultAgent(): Omit<Agent, "id"> {
    return {
      name: "新成员",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
      prompt: "请在编辑时设置该成员的具体职责和行为方式。",
      role: "participant",
      personality: "待设置",
      expertise: [],
      bias: "待设置",
      responseStyle: "待设置",
      isAutoReply: true,
    };
  }
}

const createDefaultAgentService = () => {
  return new AgentService(new MockHttpProvider<Agent>("agents", 200));
};

export const agentService = createDefaultAgentService();
