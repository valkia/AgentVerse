import { AgentMessage } from "@/types/discussion";

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
  type: 'mentioned' | 'auto_reply' | 'follow_up' | 'other';
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

  constructor(collectionTimeout?: number) {
    if (collectionTimeout) {
      this.collectionTimeout = collectionTimeout;
    }
  }

  public submit(request: SpeakRequest): void {
    this.requests.push(request);
    this.resetTimer();
  }

  public clear(): void {
    this.requests = [];
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

  private processRequests(): void {
    if (this.requests.length === 0) return;

    const nextSpeaker = this.selectNextSpeaker();
    if (!nextSpeaker) return;

    // 清空请求队列
    this.requests = [];

    // 执行回调
    nextSpeaker.onGranted().catch(error => {
      console.error('Error executing speak callback:', error);
    });
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
    if (request.reason.type === 'mentioned') {
      score += 100; // 给予很高的基础分数
    }

    // 时间因素
    const timeWeight = 0.1;
    const timeDiff = Date.now() - request.timestamp.getTime();
    score += (timeDiff * timeWeight);

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
} 