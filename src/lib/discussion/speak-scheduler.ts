import { AgentMessage } from "@/types/discussion";
import { RxEvent } from "@/lib/rx-event";
import { createNestedBean, createProxyBean } from "packages/rx-nested-bean/src";

export interface SpeakRequest {
  agentId: string;
  agentName: string;
  reason: SpeakReason;
  priority: number;
  timestamp: Date;
  message: AgentMessage;
  onGranted: () => Promise<void>;
}

export interface SpeakReason {
  type: "mentioned" | "auto_reply" | "follow_up" | "other";
  description: string;
  factors?: {
    isModerator?: boolean;
    isContextRelevant?: number; // 0-1
    timeSinceLastSpeak?: number;
  };
}

export class SpeakScheduler {
  private requests: SpeakRequest[] = [];
  private timer: NodeJS.Timeout | null = null;
  private collectionTimeout: number = 500;
  // private messageCounter: number = 0;
  private store = createNestedBean({
    messageCounter: 0,
  });
  messageCounterBean = createProxyBean(this.store, "messageCounter");
  private readonly MAX_MESSAGES = 20; // 最大消息数限制

  // 新增事件
  public onMessageProcessed$ = new RxEvent<number>(); // 发送当前计数
  public onLimitReached$ = new RxEvent<void>();

  constructor(collectionTimeout?: number) {
    if (collectionTimeout) {
      this.collectionTimeout = collectionTimeout;
    }
  }

  getRoundLimit() {
    return this.MAX_MESSAGES;
  }
  

  public submit(request: SpeakRequest): void {
    this.requests.push(request);
    this.resetTimer();
  }

  public clear(): void {
    this.requests = [];
    this.messageCounterBean.set(0);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private resetTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.processRequests();
    }, this.collectionTimeout);
  }

  private async processRequests(): Promise<void> {
    if (this.requests.length === 0) return;

    const nextSpeaker = this.selectNextSpeaker();
    if (!nextSpeaker) return;

    // 检查是否达到限制
    if (this.messageCounterBean.get() >= this.MAX_MESSAGES) {
      this.onLimitReached$.next();
      this.messageCounterBean.set(0)
      return;
    }

    // 清除被选中 agent 的所有其他请求
    this.requests = this.requests.filter(
      (req) => req.agentId !== nextSpeaker.agentId
    );

    // 执行回调
    try {
      await nextSpeaker.onGranted();
      this.messageCounterBean.set(this.messageCounterBean.get() + 1);
      this.onMessageProcessed$.next(this.messageCounterBean.get());
    } catch (error) {
      console.error("Error executing speak callback:", error);
    }
  }

  private selectNextSpeaker(): SpeakRequest | null {
    if (this.requests.length === 0) return null;

    return this.requests.reduce((highest, current) => {
      const currentScore = this.calculateScore(current);
      const highestScore = this.calculateScore(highest);

      return currentScore > highestScore ? current : highest;
    });
  }

  private calculateScore(request: SpeakRequest): number {
    let score = request.priority;

    // mention类型给予显著更高的优先级
    if (request.reason.type === "mentioned") {
      score += 100; // 给予很高的基础分数
    }

    // 时间因素
    const timeWeight = 0.1;
    const timeDiff = Date.now() - request.timestamp.getTime();
    score += timeDiff * timeWeight;

    // 其他因素
    if (request.reason.factors) {
      if (request.reason.factors.isModerator) {
        score += 20;
      }
      if (request.reason.factors.isContextRelevant) {
        score += request.reason.factors.isContextRelevant * 30;
      }
      if (request.reason.factors.timeSinceLastSpeak) {
        score += Math.min(request.reason.factors.timeSinceLastSpeak / 1000, 50);
      }
    }

    return score;
  }

  // 添加重置计数器的方法
  public resetCounter(): void {
    this.messageCounterBean.set(0);
    this.onMessageProcessed$.next(this.messageCounterBean.get());
  }
}
