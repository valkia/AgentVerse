import {
  BaseActionExecutor,
  DefaultActionExecutor,
} from "@/lib/agent/action-executor";
import { ActionDef, ActionParser } from "@/lib/agent/action-parser";
import {
  CapabilityRegistry,
  generateCapabilityPrompt,
} from "@/lib/capabilities";
import { generateId } from "@/lib/utils";
import {
  agentListResource,
  discussionMembersResource,
  messagesResource,
} from "@/resources";
import { aiService } from "@/services/ai.service";
import { discussionControlService } from "@/services/discussion-control.service";
import { messageService } from "@/services/message.service";
import { Agent } from "@/types/agent";
import {
  ActionResultMessage,
  AgentMessage,
  NormalMessage,
} from "@/types/discussion";
import {
  DiscussionKeys,
  IDiscussionEnvBus,
  SpeakReason,
  SpeakRequest,
} from "../discussion/discussion-env";
import { MENTION_RULE } from "../rules/constants";

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
  protected lastActionMessageId?: string;

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

  protected shouldRespond(message: NormalMessage): boolean {
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
    if (message.type === "action_result") {
      // 处理 action 结果
      if (message.originMessageId === this.lastActionMessageId) {
        await this.handleActionResult(message);
      }
      return;
    }

    const normalMessage = message as NormalMessage;
    if (!this.shouldRespond(normalMessage)) {
      return;
    }

    const request: SpeakRequest = {
      agentId: this.config.agentId,
      agentName: this.config.name,
      message: normalMessage,
      reason: this.getSpeakReason(normalMessage),
      priority: 0,
      timestamp: new Date(),
      onGranted: async () => {
        await this.speak(request);
      },
    };

    this.env.submitSpeakRequest(request);
  }

  protected async speak(request: SpeakRequest): Promise<void> {
    this.setState({ isThinking: true } as Partial<S>);
    const response = await this.generateResponse(
      request.message as NormalMessage
    );
    if (!response) {
      this.setState({ isThinking: false } as Partial<S>);
      return;
    }

    const message = await this.addMessage(response);
    this.state.lastSpeakTime = message.timestamp;
    this.setState({ isThinking: false } as Partial<S>);
    this.env.eventBus.emit(DiscussionKeys.Events.message, message);
    console.log("[ChatAgent.speak] onDidSendMessage", message);
    this.onDidSendMessage(message);
  }

  protected getSpeakReason(message: NormalMessage): SpeakReason {
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
    message: NormalMessage
  ): Promise<string | null>;
  protected abstract handleActionResult(
    message: ActionResultMessage
  ): Promise<void>;

  protected async addMessage(content: string): Promise<NormalMessage> {
    const discussionId = discussionControlService.getCurrentDiscussionId()!;
    const message: Omit<NormalMessage, "id"> = {
      type: "text",
      content,
      agentId: this.config.agentId,
      timestamp: new Date(),
      discussionId,
    };
    const createdMessage = await messageService.createMessage(message);
    messagesResource.current.reload();
    return createdMessage as NormalMessage;
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
  private actionParser: ActionParser = new ActionParser();
  private actionExecutor: BaseActionExecutor = new DefaultActionExecutor();
  private capabilityRegistry = CapabilityRegistry.getInstance();

  protected onEnter(): void {
    const off = this.env.eventBus.on(
      DiscussionKeys.Events.message,
      (message: AgentMessage) => {
        this.onMessage(message);
      }
    );
    this.addCleanup(off);
  }

  protected async handleActionResult(
    message: ActionResultMessage
  ): Promise<void> {
    const response = await this.generateActionResponse(message);
    if (response) {
      const agentMessage = await this.addMessage(response);
      this.env.eventBus.emit(DiscussionKeys.Events.message, agentMessage);
      this.onDidSendMessage(agentMessage);
    }
  }

  protected async generateActionResponse(
    actionMessage: ActionResultMessage
  ): Promise<string | null> {
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

    let systemPrompt = [
      this.processPromptTemplate(SYSTEM_BASE_PROMPT),
      this.getPrompt(),
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

    // 获取原始消息
    // const originalMessage = messages.find(
    //   (msg) => msg.id === actionMessage.originMessageId
    // ) as NormalMessage | undefined;
    const chatMessages = messages
      .slice(-(this.config.conversation?.contextMessages ?? 10))
      .map((msg) => {
        if (msg.type === "action_result") {
          return {
            role: "system" as const,
            content: `ActionResult:\n${JSON.stringify(msg.results, null, 2)}`,
          };
        }
        return {
          role: "system" as const,
          content: `${getAgentName(msg.agentId)}: ${
            (msg as NormalMessage).content
          }`,
        };
      });

    // 添加当前的 action 结果
    chatMessages.push({
      role: "system" as const,
      content: `ActionResult:\n${JSON.stringify(
        actionMessage.results,
        null,
        2
      )}`,
    });

    const response = await aiService.chatCompletion([
      { role: "system", content: systemPrompt },
      ...chatMessages,
    ]);
    return response;
  }

  protected async generateResponse(
    message: NormalMessage
  ): Promise<string | null> {
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

    let systemPrompt = [
      this.processPromptTemplate(SYSTEM_BASE_PROMPT),
      this.getPrompt(),
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

    // 获取上下文消息
    const contextMessages = messages
      .slice(-(this.config.conversation?.contextMessages ?? 10))
      .map((msg) => {
        if (msg.type === "action_result") {
          return {
            role: "system" as const,
            content: `Action执行结果：\n${JSON.stringify(
              msg.results,
              null,
              2
            )}`,
          };
        }
        return {
          role: "system" as const,
          content: `${getAgentName(msg.agentId)}: ${
            (msg as NormalMessage).content
          }`,
        };
      });

    // 添加当前消息
    contextMessages.push({
      role: "system" as const,
      content: `${getAgentName(message.agentId)}: ${message.content}`,
    });

    const response = await aiService.chatCompletion([
      { role: "system", content: systemPrompt },
      ...contextMessages,
    ]);
    return response;
  }

  protected onDidSendMessage(agentMessage: AgentMessage): void | Promise<void> {
    if (agentMessage.type !== "action_result") {
      this.checkActionAndRun(agentMessage as NormalMessage);
    }
  }

  protected checkActionAndRun = async (agentMessage: NormalMessage) => {
    if (this.config.role === "moderator") {
      const parseResult = this.actionParser.parse(agentMessage.content);
      console.log("[ChatAgent] ActionParseResult:", parseResult);
      if (parseResult.length === 0) return;

      const executionResult = await this.actionExecutor.execute(
        parseResult,
        this.capabilityRegistry
      );

      if (executionResult) {
        this.lastActionMessageId = agentMessage.id;

        const resultMessage: ActionResultMessage = {
          id: generateId(),
          type: "action_result",
          agentId: "system",
          timestamp: new Date(),
          discussionId: agentMessage.discussionId,
          originMessageId: agentMessage.id,
          results: executionResult.map((result, index) => {
            const action = parseResult[index].parsed as ActionDef;
            return {
              operationId: action.operationId,
              capability: result.capability,
              params: result.params || {},
              status: result.error ? "error" : "success",
              result: result.result,
              description: action.description,
              error: result.error,
            };
          }),
        };

        await messageService.addMessage(
          agentMessage.discussionId,
          resultMessage
        );
        messagesResource.current.reload();
        this.env.eventBus.emit(DiscussionKeys.Events.message, resultMessage);
      }
    }
  };
}
