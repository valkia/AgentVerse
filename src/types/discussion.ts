export interface AgentMessage {
  id: string;
  discussionId: string;  // 关联到具体会话
  agentId: string;
  content: string;
  type: "text" | "image" | "audio" | "video";
  timestamp: Date;
  mentions?: string[]; // 被 @ 的 agentId 列表
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