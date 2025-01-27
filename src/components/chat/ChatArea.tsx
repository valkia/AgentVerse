import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Agent, Message } from "@/types/agent";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";

interface ChatAreaProps {
  messages: Message[];
  agents: Agent[];
  onSendMessage: (content: string, agentId: string) => void;
  getAgentName: (agentId: string) => string;
  getAgentAvatar: (agentId: string) => string;
}

export function ChatArea({
  messages,
  agents,
  onSendMessage,
  getAgentName,
  getAgentAvatar,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    const participant = agents.find(a => a.role === 'participant');
    return participant?.id || agents[0]?.id || "";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && selectedAgentId) {
      onSendMessage(input.trim(), selectedAgentId);
      setInput("");
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b p-4 dark:border-gray-700">
        <h2 className="text-xl font-semibold dark:text-gray-100">讨论区</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="group animate-fadeIn">
              <div className="flex items-start space-x-4">
                <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-purple-500 transition-all">
                  <AvatarImage src={getAgentAvatar(message.agentId)} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                    {getAgentName(message.agentId)[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold dark:text-gray-100">
                      {getAgentName(message.agentId)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="mt-1 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <Markdown content={message.content} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-none border-t p-4 space-y-4 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-2">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-[200px] dark:bg-gray-800 dark:text-gray-100">
              <SelectValue placeholder="选择发送消息的Agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={agent.id}
                  className="flex items-center space-x-2"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={agent.avatar} />
                      <AvatarFallback>{agent.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAgent && (
            <Badge variant="outline" className="dark:text-gray-300">
              以 {selectedAgent.name} 的身份发言
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedAgent ? `以 ${selectedAgent.name} 的身份发送消息...` : "请先选择一个Agent..."}
            className="flex-1 dark:bg-gray-800 dark:text-gray-100"
            disabled={!selectedAgent}
          />
          <Button
            type="submit"
            disabled={!selectedAgent || !input.trim()}
            className={cn(
              "transition-all",
              selectedAgent && input.trim()
                ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}