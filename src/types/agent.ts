export interface Agent {
  id: string;
  name: string;
  avatar: string;
  prompt: string;
  role: 'moderator' | 'participant';
  personality: string;
  expertise: string[];
  bias: string;
  responseStyle: string;
  isAutoReply: boolean;
}

export interface Message {
  id: string;
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
  agents: Agent[];
  messages: Message[];
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