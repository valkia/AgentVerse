import { DEFAULT_SETTINGS } from "@/config/settings";
import { BaseAgent, ChatAgent } from "@/lib/agent";
import { CapabilityRegistry } from "@/lib/capabilities";
import {
  DiscussionEnvBus,
  DiscussionKeys,
} from "@/lib/discussion/discussion-env";
import { RxEvent } from "@/lib/rx-event";
import { agentListResource, discussionMembersResource } from "@/resources";
import { discussionCapabilitiesResource } from "@/resources/discussion-capabilities.resource";
import { discussionMemberService } from "@/services/discussion-member.service";
import { typingIndicatorService } from "@/services/typing-indicator.service";
import { AgentMessage, NormalMessage } from "@/types/discussion";
import { DiscussionMember } from "@/types/discussion-member";
import { createNestedBean, createProxyBean } from "rx-nested-bean";
import { agentSelector } from "./agent-selector.service";
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
  private env: DiscussionEnvBus;

  private cleanupHandlers: Array<() => void> = [];

  constructor() {
    this.env = new DiscussionEnvBus();

    discussionCapabilitiesResource.whenReady().then((data) => {
      CapabilityRegistry.getInstance().registerAll(data);
    });

    // 监听 members 变化
    const membersSub = this.membersBean.$.subscribe((members) => {
      this.syncAgentsWithMembers(members);
    });
    this.cleanupHandlers.push(() => membersSub.unsubscribe());

    // 监听 thinking 状态变化
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
    this.cleanupHandlers.push(thinkingOff);
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

  removeMember(memberId: string) {
    const members = this.membersBean.get();
    this.membersBean.set(members.filter((m) => m.agentId !== memberId));
  }

  setTopic(topic: string) {
    this.topicBean.set(topic);
  }

  getTopic() {
    return this.topicBean.get();
  }

  onMessage(message: AgentMessage) {
    this.env.eventBus.emit(DiscussionKeys.Events.message, message);
  }

  async run() {
    if (!this.isPausedBean.get()) return;
    if (this.messagesBean.get().length > 0) {
      this.isPausedBean.set(false);
      this.env.eventBus.emit(
        DiscussionKeys.Events.message,
        this.messagesBean.get()[this.messagesBean.get().length - 1]
      );
      return;
    }

    try {
      const topic = this.topicBean.get();
      if (!topic) {
        throw new DiscussionError(
          DiscussionErrorType.NO_TOPIC,
          "未设置讨论主题"
        );
      }

      // 检查当前成员数量
      const currentMembers = this.membersBean.get();
      let selectedIds: string[] = [];

      if (currentMembers.length > 1) {
        // 如果已有足够成员，直接使用现有成员
        selectedIds = currentMembers.map((member) => member.agentId);
      } else {
        // 否则使用选择器选择新成员
        const availableAgents = agentListResource.read().data;
        selectedIds = await agentSelector.selectAgents(topic, availableAgents);
        await this.updateDiscussionMembers(selectedIds);
      }

      if (selectedIds.length === 0) {
        throw new DiscussionError(
          DiscussionErrorType.NO_PARTICIPANTS,
          "没有合适的参与者"
        );
      }
      // 开始讨论
      this.isPausedBean.set(false);

      // 发送讨论开始事件，agents会自动响应
      this.env.eventBus.emit(DiscussionKeys.Events.discussionStart, { topic });

      // 发送一个初始消息来启动讨论
      const moderator = this.agents.get(selectedIds[0]);
      if (moderator) {
        this.env.eventBus.emit(DiscussionKeys.Events.message, {
          agentId: "system",
          content: `用户：${topic}`,
          type: "text",
          id: "system",
          discussionId: this.getCurrentDiscussionId()!,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.handleError(error, "讨论运行失败");
      this.pause();
    }
  }

  private async updateDiscussionMembers(agentIds: string[]) {
    const discussionId = this.getCurrentDiscussionId();
    if (!discussionId) return;

    const members: Omit<
      DiscussionMember,
      "id" | "joinedAt" | "discussionId"
    >[] = agentIds.map((id) => ({
      agentId: id,
      isAutoReply: true,
    }));
    await discussionMemberService.createMany(discussionId, members);
    discussionMembersResource.current.reload();
  }

  pause() {
    this.isPausedBean.set(true);
    // 发送讨论暂停事件
    this.env.eventBus.emit(DiscussionKeys.Events.discussionPause, null);
    // this.cleanup();
  }

  private cleanup() {
    this.timeoutManager.clearAll();
    // 清理所有事件监听器
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.cleanupHandlers = [];
  }

  clearMessages() {
    this.cleanup();
    this.messagesBean.set([]);
    this.currentRoundBean.set(0);
    this.currentSpeakerIndexBean.set(-1);
    this.settingsBean.set(DEFAULT_SETTINGS);
  }

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

  destroy() {
    // 清理所有代理
    for (const agent of this.agents.values()) {
      agent.leaveEnv();
    }
    this.agents.clear();

    // 清理环境
    this.env.destroy();

    // 清理其他资源
    this.cleanup();

    // 重置所有状态
    this.resetState();
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
}

export const discussionControlService = new DiscussionControlService();
