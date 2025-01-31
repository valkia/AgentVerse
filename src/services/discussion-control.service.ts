import { RxEvent } from "@/lib/rx-event";
import { Agent } from "@/types/agent";
import { DiscussionSettings, Message } from "@/types/discussion";
import { nanoid } from "nanoid";
import { createNestedBean, createProxyBean } from "rx-nested-bean";
import { aiService } from "./ai.service";
import { DEFAULT_SETTINGS } from "@/config/settings";
import { DiscussionMember } from "@/types/discussion-member";
import { agentService } from "./agent.service";

export class DiscussionControlService {
  // private messages: Message[] = [];
  private timeoutIds: NodeJS.Timeout[] = [];
  private currentTopic: string = "";
  private currentAgents: Agent[] = [];
  // private currentSettings: DiscussionSettings | null = null;
  // private isPaused: boolean = false;
  // private lastParticipantIndex: number = -1;
  onMessage$ = new RxEvent<Message>();
  onError$ = new RxEvent<Error>();
  onCurrentDiscussionIdChange$ = new RxEvent<string | null>();
  store = createNestedBean({
    messages: [] as Message[],
    isPaused: false,
    lastParticipantIndex: -1,
    settings: DEFAULT_SETTINGS,
    currentDiscussionId: null as string | null,
  });

  private messagesBean = createProxyBean(this.store, "messages");
  private isPausedBean = createProxyBean(this.store, "isPaused");
  private lastParticipantIndexBean = createProxyBean(
    this.store,
    "lastParticipantIndex"
  );
  private settingsBean = createProxyBean(this.store, "settings");
  private currentDiscussionIdBean = createProxyBean(
    this.store,
    "currentDiscussionId"
  );

  getCurrentDiscussionId(): string | null {
    return this.currentDiscussionIdBean.get();
  }

  getCurrentDiscussionId$()  {
    return this.currentDiscussionIdBean.$;
  }

  

  setCurrentDiscussionId(id: string | null) {
    const oldId = this.currentDiscussionIdBean.get();
    if (oldId !== id) {
      this.currentDiscussionIdBean.set(id);
      this.onCurrentDiscussionIdChange$.next(id);
    }
  }

  private createMessage(
    content: string,
    agentId: string,
    type: Message["type"]
  ): Message {
    const discussionId = this.currentDiscussionIdBean.get() ?? "";
    if (!discussionId) {
      throw new Error("未找到当前讨论");
    }
    return {
      id: nanoid(),
      agentId,
      content,
      type,
      timestamp: new Date(),
      discussionId,
    };
  }

  private addMessage(message: Message) {
    this.messagesBean.set([...this.messagesBean.get(), message]);
    this.onMessage$.next(message);
  }

  private async handleModeratorSummary(
    topic: string,
    moderator: Agent,
    settings: DiscussionSettings,
    participants: Agent[]
  ) {
    if (this.isPausedBean.get()) return;

    try {
      const summary = await aiService.generateModeratorSummary(
        topic,
        settings.temperature,
        this.messagesBean.get(),
        moderator
      );

      const summaryMessage = this.createMessage(
        summary,
        moderator.id,
        "summary"
      );
      this.addMessage(summaryMessage);

      // 开始新一轮讨论
      this.lastParticipantIndexBean.set(-1);
      participants.forEach((_, index) => {
        this.scheduleParticipantResponse(
          topic,
          participants,
          index,
          settings,
          moderator,
          settings.interval * (index + 1)
        );
      });
    } catch (error) {
      if (error instanceof Error) {
        this.onError$.next(error);
      }
    }
  }

  private scheduleParticipantResponse(
    topic: string,
    participants: Agent[],
    index: number,
    settings: DiscussionSettings,
    moderator: Agent,
    delay: number
  ) {
    const timeoutId = setTimeout(async () => {
      if (this.isPausedBean.get()) return;

      const currentAgent = participants[index];
      if (!currentAgent) return;

      try {
        const response = await aiService.generateResponse(
          topic,
          settings.temperature,
          this.messagesBean.get(),
          currentAgent
        );

        const message = this.createMessage(response, currentAgent.id, "text");
        this.addMessage(message);
        this.lastParticipantIndexBean.set(index);

        // 如果是最后一个参与者，让主持人总结
        if (index === participants.length - 1) {
          const summaryTimeoutId = setTimeout(() => {
            this.handleModeratorSummary(
              topic,
              moderator,
              settings,
              participants
            );
          }, settings.interval);
          this.timeoutIds.push(summaryTimeoutId);
        }
      } catch (error) {
        if (error instanceof Error) {
          this.onError$.next(error);
        }
      }
    }, delay);

    this.timeoutIds.push(timeoutId);
  }

  async startDiscussion(topic: string, members: DiscussionMember[]) {
    this.currentTopic = topic;
    this.isPausedBean.set(false);

    // 获取所有成员对应的 Agent 信息
    const agents = await Promise.all(
      members.map(member => agentService.getAgent(member.agentId))
    );

    const moderator = agents.find((agent) => agent.role === "moderator");
    if (!moderator) {
      throw new Error("未找到主持人角色");
    }

    try {
      if (this.lastParticipantIndexBean.get() === -1) {
        // 主持人开场
        const openingMessage = await aiService.generateResponse(
          topic,
          this.settingsBean.get().temperature,
          this.messagesBean.get(),
          moderator
        );

        const message = this.createMessage(
          openingMessage,
          moderator.id,
          "text"
        );
        this.addMessage(message);
      }

      // 让参与者轮流发言
      const participants = agents.filter(
        (agent) => agent.role === "participant"
      );

      // 从上次暂停的位置继续
      const startIndex = Math.max(0, this.lastParticipantIndexBean.get() + 1);
      for (let i = startIndex; i < participants.length; i++) {
        this.scheduleParticipantResponse(
          topic,
          participants,
          i,
          this.settingsBean.get(),
          moderator,
          this.settingsBean.get().interval * (i - startIndex + 1)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        this.onError$.next(error);
      }
    }
  }

  stopDiscussion() {
    this.isPausedBean.set(true);
    this.timeoutIds.forEach((id) => clearTimeout(id));
    this.timeoutIds = [];
  }

  clearMessages() {
    this.messagesBean.set([]);
    this.lastParticipantIndexBean.set(-1);
    this.currentTopic = "";
    this.currentAgents = [];
    this.settingsBean.set(DEFAULT_SETTINGS);
    this.currentDiscussionIdBean.set(null);
  }
}

export const discussionControlService = new DiscussionControlService();
