import { Agent, DiscussionSettings, Message } from '@/types/agent';
import { nanoid } from 'nanoid';
import { aiService } from './ai.service';

interface DiscussionServiceEvents {
  onMessage: (message: Message) => void;
  onError: (error: Error) => void;
}

export class DiscussionService {
  private messages: Message[] = [];
  private timeoutIds: NodeJS.Timeout[] = [];
  private events: DiscussionServiceEvents;

  constructor(events: DiscussionServiceEvents) {
    this.events = events;
  }

  private createMessage(content: string, agentId: string, type: Message['type']): Message {
    return {
      id: nanoid(),
      agentId,
      content,
      type,
      timestamp: new Date()
    };
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.events.onMessage(message);
  }

  private async handleModeratorSummary(
    topic: string,
    moderator: Agent,
    settings: DiscussionSettings,
    participants: Agent[]
  ) {
    try {
      const summary = await aiService.generateModeratorSummary(
        topic,
        settings.temperature,
        this.messages,
        moderator
      );

      const summaryMessage = this.createMessage(summary, moderator.id, 'summary');
      this.addMessage(summaryMessage);

      // 开始新一轮讨论
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
        this.events.onError(error);
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
      const currentAgent = participants[index];
      if (!currentAgent) return;

      try {
        const response = await aiService.generateResponse(
          topic,
          settings.temperature,
          this.messages,
          currentAgent
        );

        const message = this.createMessage(response, currentAgent.id, 'text');
        this.addMessage(message);

        // 如果是最后一个参与者，让主持人总结
        if (index === participants.length - 1) {
          const summaryTimeoutId = setTimeout(() => {
            this.handleModeratorSummary(topic, moderator, settings, participants);
          }, settings.interval);
          this.timeoutIds.push(summaryTimeoutId);
        }
      } catch (error) {
        if (error instanceof Error) {
          this.events.onError(error);
        }
      }
    }, delay);

    this.timeoutIds.push(timeoutId);
  }

  async startDiscussion(
    topic: string,
    agents: Agent[],
    settings: DiscussionSettings
  ) {
    const moderator = agents.find(agent => agent.role === 'moderator');
    if (!moderator) {
      throw new Error('未找到主持人角色');
    }

    try {
      // 主持人开场
      const openingMessage = await aiService.generateResponse(
        topic,
        settings.temperature,
        this.messages,
        moderator
      );
      
      const message = this.createMessage(openingMessage, moderator.id, 'text');
      this.addMessage(message);

      // 让参与者轮流发言
      const participants = agents.filter(agent => 
        agent.role === 'participant' && agent.isAutoReply
      );

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
        this.events.onError(error);
      }
    }
  }

  stopDiscussion() {
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];
  }

  clearMessages() {
    this.messages = [];
  }
} 