import { useState, useCallback } from "react";
import { Message } from "@/types/agent";
import { nanoid } from "nanoid";

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback(
    async (content: string, agentId: string, type: Message["type"] = "text", replyTo?: string) => {
      const newMessage: Message = {
        id: nanoid(),
        agentId,
        content,
        type,
        timestamp: new Date(),
        replyTo,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  return {
    messages,
    addMessage,
  };
} 