export interface Message {
  id: string;
  discussionId: string;  // 关联到具体会话
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'summary' | 'question' | 'conclusion';
  replyTo?: string;  // 回复某条消息的ID
}

export interface Discussion {
  id: string;
  title: string;
  topic: string;
  status: 'active' | 'paused' | 'completed';
  settings: DiscussionSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionSettings {
  maxRounds: number;
  temperature: number;
  interval: number;
  moderationStyle: 'strict' | 'relaxed';
  focusTopics: string[];
  allowConflict: boolean;
}