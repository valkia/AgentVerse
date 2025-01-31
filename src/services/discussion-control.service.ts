import { DEFAULT_SETTINGS } from "@/config/settings";
import { RxEvent } from "@/lib/rx-event";
import { Agent } from "@/types/agent";
import { Message } from "@/types/discussion";
import { DiscussionMember } from "@/types/discussion-member";
import { nanoid } from "nanoid";
import { createNestedBean, createProxyBean } from "rx-nested-bean";
import { agentService } from "./agent.service";
import { AIService, aiService } from "./ai.service";
import {
  DiscussionError,
  DiscussionErrorType,
  handleDiscussionError,
} from "./discussion-error.util";
import { typingIndicatorService } from "./typing-indicator.service";

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
    messages: [] as Message[],
    isPaused: true,
    currentDiscussionId: null as string | null,
    settings: DEFAULT_SETTINGS,
    currentRound: 0,
    currentSpeakerIndex: -1,
    members: [] as DiscussionMember[],
    topic: "",
  });

  onMessage$ = new RxEvent<Message>();
  onError$ = new RxEvent<Error>();
  onCurrentDiscussionIdChange$ = new RxEvent<string | null>();

  private messagesBean = createProxyBean(this.store, "messages");
  isPausedBean = createProxyBean(this.store, "isPaused");
  private settingsBean = createProxyBean(this.store, "settings");
  currentDiscussionIdBean = createProxyBean(this.store, "currentDiscussionId");
  private currentRoundBean = createProxyBean(this.store, "currentRound");
  private currentSpeakerIndexBean = createProxyBean(this.store, "currentSpeakerIndex");
  private membersBean = createProxyBean(this.store, "members");
  private topicBean = createProxyBean(this.store, "topic");

  private timeoutManager = new TimeoutManager();

  constructor(private aiService: AIService) {}

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
  
  setMessages(messages: Message[]) {
    this.messagesBean.set(messages);
  }

  removeMember(memberId: string) {
    const members = this.membersBean.get();
    this.membersBean.set(members.filter(m => m.agentId !== memberId));
  }

  setTopic(topic: string) {
    this.topicBean.set(topic);
  }

  getTopic() {
    return this.topicBean.get();
  }

  private async handleModeratorTurn(moderator: Agent, topic: string) {
    const isFirstRound = this.currentRoundBean.get() === 0;
    await this.generateAndAddMessage(
      topic,
      moderator,
      isFirstRound ? "text" : "summary",
      isFirstRound ? "主持人开场失败" : "生成总结失败"
    );
  }

  private async handleParticipantTurn(
    participant: Agent, 
    topic: string, 
    index: number
  ) {
    const member = this.membersBean.get()
      .find(m => m.agentId === participant.id);
    
    if (!member || !member.isAutoReply) {
      return false;
    }

    this.currentSpeakerIndexBean.set(index);
    await this.generateAndAddMessage(
      topic,
      participant,
      "text",
      "生成回复失败"
    );
    
    await new Promise<void>(resolve => 
      this.timeoutManager.schedule(
        resolve, 
        this.settingsBean.get().interval
      )
    );

    return true;
  }

  private async runDiscussionRound(
    moderator: Agent,
    participants: Agent[],
    topic: string
  ) {
    // 主持人回合
    await this.handleModeratorTurn(moderator, topic);

    // 参与者回合
    let activeParticipants = 0;
    for (let i = 0; i < participants.length; i++) {
      if (this.isPausedBean.get()) {
        return false;
      }
      
      const participated = await this.handleParticipantTurn(
        participants[i],
        topic,
        i
      );
      
      if (participated) {
        activeParticipants++;
      }
    }

    return activeParticipants > 0;
  }

  async run() {
    if (!this.isPausedBean.get()) {
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

      this.isPausedBean.set(false);
      
      while (!this.isPausedBean.get()) {
        // 获取最新成员状态
        const currentMembers = this.membersBean.get();
        const currentAgents = await Promise.all(
          currentMembers.map(member => agentService.getAgent(member.agentId))
        );
        
        const moderator = currentAgents.find(agent => agent.role === "moderator");
        const participants = currentAgents.filter(agent => agent.role === "participant");
        
        if (!moderator) {
          throw new DiscussionError(
            DiscussionErrorType.NO_MODERATOR,
            "未找到主持人角色"
          );
        }

        // 运行一轮讨论
        const hasActiveParticipants = await this.runDiscussionRound(
          moderator,
          participants,
          topic
        );

        if (!hasActiveParticipants) {
          this.pause();
          throw new DiscussionError(
            DiscussionErrorType.NO_PARTICIPANTS,
            "所有参与者已离开讨论"
          );
        }

        this.currentRoundBean.set(this.currentRoundBean.get() + 1);
      }
    } catch (error) {
      this.handleError(error, "讨论运行失败", { topic: this.topicBean.get() });
      this.pause();
    } finally {
      this.cleanup();
    }
  }

  pause() {
    this.isPausedBean.set(true);
    this.cleanup();
  }

  private cleanup() {
    this.timeoutManager.clearAll();
  }

  private async generateAndAddMessage(
    topic: string,
    agent: Agent,
    type: Message["type"],
    errorMessage: string
  ) {
    try {
      typingIndicatorService.updateStatus(agent.id, 'thinking');
      const content = type === "summary"
        ? await this.aiService.generateModeratorSummary(
            topic,
            this.settingsBean.get().temperature,
            this.messagesBean.get(),
            agent
          )
        : await this.aiService.generateResponse(
            topic,
            this.settingsBean.get().temperature,
            this.messagesBean.get(),
            agent
          );

      const message = {
        id: nanoid(),
        agentId: agent.id,
        content,
        type,
        timestamp: new Date(),
        discussionId: this.currentDiscussionIdBean.get() ?? "",
      };

      this.messagesBean.set([...this.messagesBean.get(), message]);
      this.onMessage$.next(message);
    } catch (error) {
      this.handleError(error, errorMessage, { topic, agentId: agent.id });
      throw error;
    } finally {
      typingIndicatorService.updateStatus(agent.id, null);
    }
  }

  clearMessages() {
    this.cleanup();
    this.messagesBean.set([]);
    this.currentRoundBean.set(0);
    this.currentSpeakerIndexBean.set(-1);
    this.settingsBean.set(DEFAULT_SETTINGS);
    this.currentDiscussionIdBean.set(null);
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
}

export const discussionControlService = new DiscussionControlService(aiService);
