import { DEFAULT_SETTINGS } from "@/config/settings";
import { BaseAgent, ChatAgent } from "@/lib/agent";
import { CapabilityRegistry } from "@/lib/capabilities";
import {
  DiscussionEnvBus,
  DiscussionKeys,
} from "@/lib/discussion/discussion-env";
import { RxEvent } from "@/lib/rx-event";
import { agentListResource, messagesResource } from "@/resources";
import { discussionCapabilitiesResource } from "@/resources/discussion-capabilities.resource";
import { messageService } from "@/services/message.service";
import { typingIndicatorService } from "@/services/typing-indicator.service";
import { AgentMessage, NormalMessage } from "@/types/discussion";
import { DiscussionMember } from "@/types/discussion-member";
import { createNestedBean, createProxyBean } from "rx-nested-bean";
import {
  DiscussionError,
  DiscussionErrorType,
  handleDiscussionError,
} from "./discussion-error.util";

class TimeoutManager {
  private timeouts = new Set<NodeJS.Timeout>();

  schedule(fn: () => void, delay: number) {
    const timeout = setTimeout(() => {
      fn();
      this.timeouts.delete(timeout);
    }, delay);
    this.timeouts.add(timeout);
    return timeout;
  }

  clearAll() {
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
  }
}

export class DiscussionControlService {
  store = createNestedBean({
    messages: [] as AgentMessage[],
    isPaused: true,
    currentDiscussionId: null as string | null,
    settings: DEFAULT_SETTINGS,
    currentRound: 0,
    currentSpeakerIndex: -1,
    members: [] as DiscussionMember[],
    topic: "",
  });

  onRequestSendMessage$ = new RxEvent<
    Pick<NormalMessage, "agentId" | "content" | "type">
  >();
  onError$ = new RxEvent<Error>();
  onCurrentDiscussionIdChange$ = new RxEvent<string | null>();

  private messagesBean = createProxyBean(this.store, "messages");
  isPausedBean = createProxyBean(this.store, "isPaused");
  private settingsBean = createProxyBean(this.store, "settings");
  currentDiscussionIdBean = createProxyBean(this.store, "currentDiscussionId");
  private currentRoundBean = createProxyBean(this.store, "currentRound");
  private currentSpeakerIndexBean = createProxyBean(
    this.store,
    "currentSpeakerIndex"
  );
  private membersBean = createProxyBean(this.store, "members");
  private topicBean = createProxyBean(this.store, "topic");

  private timeoutManager = new TimeoutManager();
  private agents: Map<string, BaseAgent> = new Map();
  env: DiscussionEnvBus;

  // 生命周期管理
  private serviceCleanupHandlers: Array<() => void> = []; // 服务级清理
  private discussionCleanupHandlers: Array<() => void> = []; // 讨论级清理
  private runtimeCleanupHandlers: Array<() => void> = []; // 运行时清理

  constructor() {
    this.env = new DiscussionEnvBus();
    this.initializeService();
  }

  // 服务级初始化
  private initializeService() {
    // 1. 注册能力
    discussionCapabilitiesResource.whenReady().then((data) => {
      CapabilityRegistry.getInstance().registerAll(data);
    });

    // 2. 监听成员变化
    const membersSub = this.membersBean.$.subscribe((members) => {
      this.syncAgentsWithMembers(members);
    });
    this.serviceCleanupHandlers.push(() => membersSub.unsubscribe());
  }

  private syncAgentsWithMembers(members: DiscussionMember[]) {
    // 移除不在 members 中的 agents
    for (const [agentId, agent] of this.agents) {
      if (!members.find((m) => m.agentId === agentId)) {
        agent.leaveEnv();
        this.agents.delete(agentId);
      }
    }

    // 更新或添加 agents
    for (const member of members) {
      const agentData = agentListResource
        .read()
        .data.find((agent) => agent.id === member.agentId)!;
      const existingAgent = this.agents.get(member.agentId);
      if (existingAgent) {
        // 更新现有 agent 的配置
        existingAgent.updateConfig({
          ...agentData,
        });
        // 更新状态
        existingAgent.updateState({
          autoReply: member.isAutoReply,
        });
      } else {
        // 创建新的 agent
        const agent = new ChatAgent(
          {
            ...agentData,
            agentId: member.agentId,
          },
          { autoReply: member.isAutoReply }
        );
        this.agents.set(member.agentId, agent);
        agent.enterEnv(this.env);
      }
    }
  }

  getCurrentDiscussionId(): string | null {
    return this.currentDiscussionIdBean.get();
  }

  getCurrentDiscussionId$() {
    return this.currentDiscussionIdBean.$;
  }

  setCurrentDiscussionId(id: string | null) {
    const oldId = this.currentDiscussionIdBean.get();
    if (oldId !== id) {
      this.currentDiscussionIdBean.set(id);
      this.onCurrentDiscussionIdChange$.next(id);
    }
  }

  setMembers(members: DiscussionMember[]) {
    this.membersBean.set(members);
  }

  setMessages(messages: AgentMessage[]) {
    this.messagesBean.set(messages);
  }

  onMessage(message: AgentMessage) {
    this.env.eventBus.emit(DiscussionKeys.Events.message, message);
  }

  // 讨论级初始化
  private initializeDiscussion() {
    // 添加讨论级事件监听
    const thinkingOff = this.env.eventBus.on(
      DiscussionKeys.Events.thinking,
      (state) => {
        const { agentId, isThinking } = state;
        typingIndicatorService.updateStatus(
          agentId,
          isThinking ? "thinking" : null
        );
      }
    );
    this.discussionCleanupHandlers.push(thinkingOff);

    // 添加消息限制监听
    const scheduler = this.env.speakScheduler;
    const limitReachedOff = scheduler.onLimitReached$.listen(() => {
      // 添加系统消息
      const warningMessage: NormalMessage = {
        agentId: "system",
        content: `由于本轮消息数量达到限制（${scheduler.getRoundLimit()}条），讨论已自动暂停。这是为了避免自动对话消耗过多资源，您可手动重启对话。此为临时解决方案，后续会努力提供更合理的自动终止策略。`,
        type: "text",
        id: `system-${Date.now()}`,
        discussionId: this.getCurrentDiscussionId()!,
        timestamp: new Date(),
      };
      messageService.addMessage(
        this.currentDiscussionIdBean.get()!,
        warningMessage
      );
      messagesResource.current.reload();
      // 暂停讨论
      this.pause();
    });

    this.discussionCleanupHandlers.push(limitReachedOff);
  }

  // 运行时控制
  pause() {
    // 1. 设置暂停状态
    this.isPausedBean.set(true);

    // 2. 暂停所有 agents
    for (const agent of this.agents.values()) {
      agent.pause();
    }

    // 3. 发送讨论暂停事件
    this.env.eventBus.emit(DiscussionKeys.Events.discussionPause, null);

    // 4. 清理运行时资源
    this.cleanupRuntime();

    // 重置计数器
    const scheduler = this.env.speakScheduler;
    scheduler.resetCounter();
  }

  resume() {
    // 1. 设置恢复状态
    this.isPausedBean.set(false);

    // 2. 恢复所有 agents
    for (const agent of this.agents.values()) {
      agent.resume();
    }
  }

  // 清理方法分层
  private cleanupRuntime() {
    // 清理运行时资源（定时器等）
    this.timeoutManager.clearAll();
    this.runtimeCleanupHandlers.forEach((cleanup) => cleanup());
    this.runtimeCleanupHandlers = [];
  }

  private cleanupDiscussion() {
    // 清理讨论级资源
    this.discussionCleanupHandlers.forEach((cleanup) => cleanup());
    this.discussionCleanupHandlers = [];
    this.cleanupRuntime(); // 同时清理运行时资源
  }

  private cleanupService() {
    // 清理服务级资源
    this.serviceCleanupHandlers.forEach((cleanup) => cleanup());
    this.serviceCleanupHandlers = [];
    this.cleanupDiscussion(); // 同时清理讨论级资源
  }

  // 完全销毁服务
  destroy() {
    // 1. 清理所有代理
    for (const agent of this.agents.values()) {
      agent.leaveEnv();
    }
    this.agents.clear();

    // 2. 清理环境
    this.env.destroy();

    // 3. 清理所有级别的资源
    this.cleanupService();

    // 4. 重置所有状态
    this.resetState();
  }

  // 状态重置
  private resetState() {
    this.messagesBean.set([]);
    this.isPausedBean.set(true);
    this.currentDiscussionIdBean.set(null);
    this.settingsBean.set(DEFAULT_SETTINGS);
    this.currentRoundBean.set(0);
    this.currentSpeakerIndexBean.set(-1);
    this.membersBean.set([]);
    this.topicBean.set("");
  }

  private handleError(
    error: unknown,
    message: string,
    context?: Record<string, unknown>
  ) {
    const discussionError =
      error instanceof DiscussionError
        ? error
        : new DiscussionError(
            DiscussionErrorType.GENERATE_RESPONSE,
            message,
            error,
            context
          );

    const { shouldPause } = handleDiscussionError(discussionError);
    if (shouldPause) {
      this.isPausedBean.set(true);
    }

    this.onError$.next(discussionError);
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  // 恢复已有讨论
  private async resumeExistingDiscussion(): Promise<void> {
    const messages = this.messagesBean.get();
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // 1. 恢复讨论级资源
      await this.initializeDiscussion();

      // 2. 恢复运行时状态
      this.resume();

      // 3. 重放最后一条消息
      this.env.eventBus.emit(DiscussionKeys.Events.message, lastMessage);
    }
  }

  // 主入口方法
  async run(): Promise<void> {
    try {
      // 1. 检查是否已经在运行
      if (!this.isPausedBean.get()) {
        console.log("[DiscussionControl] Discussion is already running");
        return;
      }

      // 2. 检查是否有历史消息和成员，如果有则恢复讨论
      if (
        this.messagesBean.get().length > 0 &&
        this.membersBean.get().length > 0
      ) {
        console.log("[DiscussionControl] Resuming existing discussion");
        await this.resumeExistingDiscussion();
        return;
      }
    } catch (error) {
      console.error("[DiscussionControl] Failed to run discussion:", error);
      this.handleError(error, "讨论运行失败");
      this.pause();
    }
  }
}

export const discussionControlService = new DiscussionControlService();
