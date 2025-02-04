import {
  CapabilityRegistry,
  generateCapabilityPrompt,
} from "@/lib/capabilities";
import {
  agentListResource,
  discussionMembersResource,
  messagesResource,
} from "@/resources";
import { aiService } from "@/services/ai.service";
import { discussionControlService } from "@/services/discussion-control.service";
import { messageService } from "@/services/message.service";
import { Agent } from "@/types/agent";
import { AgentMessage } from "@/types/discussion";
import {
  DiscussionKeys,
  IDiscussionEnvBus,
  SpeakReason,
  SpeakRequest,
} from "./discussion/discussion-env";
import { MENTION_RULE } from "./rules/constants";

/**
 * Agent的基础配置接口
 */
export interface IAgentConfig extends Agent {
  name: string;
  agentId: string;
  /**
   * 提示词模板，支持使用变量插值
   * @example
   * ```
   * 你是一个名叫{{agent.name}}的助手。
   * 你非常擅长聊天，善于倾听和回答问题。
   * 你会以专业、友好的方式帮助用户解决问题。
   * ```
   */
  prompt: string;
  conversation?: {
    minResponseDelay?: number;
    contextMessages?: number;
  };
  // [key: string]: unknown;
}

export interface BaseAgentState {
  lastSpeakTime?: Date;
  isThinking?: boolean;
  respondToSelf?: boolean;
  autoReply?: boolean;
}

/**
 * Agent的基础类
 * S 类型不能包含 InternalState 中的字段
 */
export abstract class BaseAgent<S extends BaseAgentState = BaseAgentState> {
  protected env!: IDiscussionEnvBus;
  protected config: IAgentConfig;
  protected state: S;

  constructor(config: IAgentConfig, initialState: S) {
    this.config = config;
    this.state = { ...initialState };
  }

  updateConfig(config: Partial<IAgentConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  updateState(state: Partial<S>): void {
    this.state = {
      ...this.state,
      ...state,
    };
  }

  protected getPrompt(): string {
    if (!this.config.prompt) return "";
    return this.processPromptTemplate(this.config.prompt);
  }

  protected processPromptTemplate(template: string): string {
    const context = {
      agent: this.config,
      // 未来可以在这里添加更多上下文
      // env: this.env,
      // state: this.state,
    };

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const path = expression.trim();
        // 未来可以在这里添加函数调用支持
        // if (path.includes('(')) { ... }

        const keys = path.split(".");
        let value: unknown = context;

        for (const key of keys) {
          if (value && typeof value === "object") {
            value = (value as Record<string, unknown>)[key];
          } else {
            return match;
          }
        }

        return value === undefined ? match : String(value);
      } catch {
        return match;
      }
    });
  }

  public enterEnv(env: IDiscussionEnvBus): void {
    if (this.env) {
      throw new Error(`Agent ${this.config.name} is already in an environment`);
    }
    this.env = env;
    this.onEnter();
  }

  public leaveEnv(): void {
    if (!this.env) {
      throw new Error(`Agent ${this.config.name} is not in any environment`);
    }

    try {
      this.onLeave();
      this.cleanupHandlers.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error(
            `Error during cleanup in agent ${this.config.name}:`,
            error
          );
        }
      });
    } finally {
      this.cleanupHandlers = [];
      this.env = undefined!;
    }
  }

  protected addCleanup(cleanup: () => void): void {
    this.cleanupHandlers.push(cleanup);
  }

  protected setState(
    updates: Partial<S> | ((prevState: S) => Partial<S>)
  ): void {
    const prevState = this.state;
    this.state = {
      ...this.state,
      ...(typeof updates === "function" ? updates(prevState) : updates),
    };

    // 当isThinking状态改变时，发送事件
    if (
      "isThinking" in this.state &&
      prevState.isThinking !== this.state.isThinking
    ) {
      this.env.eventBus.emit(DiscussionKeys.Events.thinking, {
        agentId: this.config.agentId,
        isThinking: this.state.isThinking || false,
      });
    }
  }

  protected shouldRespond(message: AgentMessage): boolean {
    // 检查是否被 @ 了
    const isMentioned = this.checkIfMentioned(
      message.content,
      this.config.name
    );
    // 如果被 @ 了，强制回复
    if (isMentioned) {
      return true;
    }

    // 如果没有开启自动回复，不响应
    if (!this.state.autoReply) {
      return false;
    }

    // 如果正在思考，不要回复
    if (this.state.isThinking) {
      return false;
    }

    // 检查是否有人在说话
    const currentSpeaker = this.env.stateBus.get(
      DiscussionKeys.States.speaking
    );
    if (currentSpeaker) {
      return false;
    }

    // 是否回复自己的消息
    if (!this.state.respondToSelf && message.agentId === this.config.agentId) {
      return false;
    }

    // 检查发言间隔
    if (this.state.lastSpeakTime) {
      const elapsed = Date.now() - this.state.lastSpeakTime.getTime();
      if (elapsed < (this.config.conversation?.minResponseDelay ?? 0)) {
        return false;
      }
    }

    return true;
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (!this.shouldRespond(message)) {
      return;
    }

    // 提交发言请求
    const request: SpeakRequest = {
      agentId: this.config.agentId,
      agentName: this.config.name,
      reason: this.getSpeakReason(message),
      priority: 0, // 基础优先级
      timestamp: new Date(),
      message,
      onGranted: () => this.speak(message), // 直接传入回调函数
    };

    this.env.submitSpeakRequest(request);
  }

  private async speak(message: AgentMessage): Promise<void> {
    let agentMessage: AgentMessage | null = null;
    try {
      this.env.stateBus.set(
        DiscussionKeys.States.speaking,
        this.config.agentId
      );
      this.setState({ isThinking: true } as Partial<S>);

      const response = await this.generateResponse(message);
      if (response) {
        agentMessage = await this.addMessage(response);
      }
    } finally {
      this.setState({
        isThinking: false,
        lastSpeakTime: new Date(),
      } as Partial<S>);
      this.env.stateBus.set(DiscussionKeys.States.speaking, null);
      if (agentMessage) {
        this.env.eventBus.emit(DiscussionKeys.Events.message, agentMessage);
        this.onDidSendMessage(agentMessage);
      }
    }
  }

  private getSpeakReason(message: AgentMessage): SpeakReason {
    const isMentioned = this.checkIfMentioned(
      message.content,
      this.config.name
    );

    if (isMentioned) {
      return {
        type: "mentioned",
        description: "被直接提及",
        factors: {
          isModerator: this.config.role === "moderator",
          isContextRelevant: 1,
        },
      };
    }

    return {
      type: "auto_reply",
      description: "自动回复",
      factors: {
        isModerator: this.config.role === "moderator",
        isContextRelevant: 0.5,
        timeSinceLastSpeak: this.state.lastSpeakTime
          ? Date.now() - this.state.lastSpeakTime.getTime()
          : Infinity,
      },
    };
  }

  protected abstract onDidSendMessage(
    agentMessage: AgentMessage
  ): void | Promise<void>;

  protected abstract generateResponse(
    message: AgentMessage
  ): Promise<string | null>;

  protected async addMessage(content: string): Promise<AgentMessage> {
    const discussionId = discussionControlService.getCurrentDiscussionId()!;
    const message = await messageService.addMessage(discussionId, {
      agentId: this.config.agentId,
      content,
      type: "text",
      timestamp: new Date(),
    });
    messagesResource.current.reload();
    return message;
  }

  protected abstract onEnter(): void;
  protected onLeave(): void {}

  private cleanupHandlers: Array<() => void> = [];

  // 检查消息中是否 @ 了当前 agent
  private checkIfMentioned(content: string, name: string): boolean {
    const mentionPattern = new RegExp(`@(?:"${name}"|'${name}'|${name})`, "i");
    return mentionPattern.test(content);
  }
}

// 添加系统默认 prompt 常量
const SYSTEM_BASE_PROMPT = `你是 {{agent.name}}`;

/**
 * 示例：一个简单的聊天Agent
 */
export class ChatAgent extends BaseAgent {
  protected onEnter(): void {
    const off = this.env.eventBus.on(
      DiscussionKeys.Events.message,
      (message: AgentMessage) => {
        this.onMessage(message);
      }
    );
    this.addCleanup(off);
  }

  protected onDidSendMessage(agentMessage: AgentMessage): void | Promise<void> {
    this.checkActionAndRun(agentMessage);
  }

  protected checkActionAndRun = async (agentMessage: AgentMessage) => {
    const { discussionId } = agentMessage;
    // 如果是主导Agent，处理能力调用
    if (this.config.role === "moderator") {
      const executionResult = await this.executeCapabilities(
        agentMessage.content
      );
      if (executionResult) {
        const executionMessage = await messageService.addMessage(discussionId, {
          agentId: "system",
          content: `执行结果：\n${JSON.stringify(executionResult, null, 2)}`,
          type: "text",
          timestamp: new Date(),
        });
        messagesResource.current.reload();
        // 将执行结果添加到对话，并重新生成回复
        this.env.eventBus.emit(DiscussionKeys.Events.message, executionMessage);
      }
    }
  };

  protected async generateResponse(): Promise<string | null> {
    const discussionId = discussionControlService.getCurrentDiscussionId();
    if (!discussionId) return null;

    const messages = await messageService.listMessages(discussionId);
    const agentList = agentListResource.read().data;
    const memberAgents = (
      await discussionMembersResource.current.whenReady()
    ).map((member) => agentList.find((agent) => agent.id === member.agentId)!);
    const getAgentName = (agentId: string) => {
      const agent = agentList.find((agent) => agent.id === agentId);
      return agent?.name ?? agentId;
    };

    // 修改系统提示的构建逻辑
    let systemPrompt = [
      this.processPromptTemplate(SYSTEM_BASE_PROMPT), // 添加基础系统 prompt
      this.getPrompt(), // 添加特定 agent 的 prompt
    ].join("\n\n");

    if (this.config.role === "moderator") {
      systemPrompt = [
        systemPrompt,
        MENTION_RULE.generatePrompt(memberAgents),
        generateCapabilityPrompt(
          CapabilityRegistry.getInstance().getCapabilities()
        ),
      ].join("\n\n");
    }

    const chatMessages = messages
      .slice(-(this.config.conversation?.contextMessages ?? 10))
      .map((msg) => ({
        role: "system" as const,
        content: `${getAgentName(msg.agentId)}: ${msg.content}`,
      }));

    const initialResponse = await aiService.chatCompletion([
      { role: "system", content: systemPrompt },
      ...chatMessages,
    ]);
    return initialResponse;
  }

  private async executeCapabilities(response: string): Promise<unknown> {
    const results = [];

    try {
      // 1. 解析所有action
      const matches = response.matchAll(/<action>([\s\S]*?)<\/action>/g);
      for (const match of matches) {
        try {
          const action = JSON.parse(match[1]);
          if (action?.capability) {
            try {
              const result = await CapabilityRegistry.getInstance().execute(
                action.capability,
                action.params
              );
              results.push({
                capability: action.capability,
                params: action.params,
                result: result,
                status: "success",
              });
            } catch (executionError: unknown) {
              results.push({
                capability: action.capability,
                params: action.params,
                error:
                  executionError instanceof Error
                    ? executionError.message
                    : String(executionError),
                status: "execution_error",
              });
            }
          }
        } catch (parseError: unknown) {
          results.push({
            error: "Action解析失败",
            details:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
            raw: match[1],
            status: "parse_error",
          });
        }
      }
    } catch (error: unknown) {
      results.push({
        error: "未知错误",
        details: error instanceof Error ? error.message : String(error),
        status: "unknown_error",
      });
    }

    return results.length > 0 ? results : null;
  }
}
