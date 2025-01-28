import { AgentForm } from "@/components/agent/AgentForm";
import { AgentList } from "@/components/agent/AgentList";
import { ChatArea } from "@/components/chat/ChatArea";
import { Agent, Message, Discussion, DiscussionSettings } from "@/types/agent";
import { nanoid } from "nanoid";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DiscussionController } from "@/components/discussion/DiscussionController";

// 预设的Agent列表
const DEFAULT_AGENTS: Omit<Agent, "id">[] = [
  {
    name: "理性主持人",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=moderator",
    prompt:
      "你是一位理性、公正的主持人。你的职责是：\n1. 引导讨论方向\n2. 确保每位参与者都有发言机会\n3. 总结关键观点\n4. 在讨论偏离主题时进行适当干预",
    role: "moderator",
    personality: "理性、公正、严谨",
    expertise: ["主持", "引导", "总结"],
    bias: "中立",
    responseStyle: "清晰、有条理",
    isAutoReply: true,
  },
  {
    name: "技术专家",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=tech",
    prompt:
      "你是一位资深技术专家，专注于AI和机器学习领域。你应该：\n1. 从技术可行性角度分析问题\n2. 提供具体的技术实现方案\n3. 指出潜在的技术风险\n4. 关注技术发展趋势",
    role: "participant",
    personality: "严谨、专业、务实",
    expertise: ["人工智能", "机器学习", "软件工程"],
    bias: "技术导向",
    responseStyle: "专业、详细",
    isAutoReply: true,
  },
  {
    name: "伦理学者",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ethics",
    prompt:
      "你是一位伦理学专家，关注AI发展的伦理问题。你应该：\n1. 评估道德和伦理影响\n2. 提出伦理准则建议\n3. 关注人权和隐私问题\n4. 平衡发展与伦理的关系",
    role: "participant",
    personality: "谨慎、富有同理心",
    expertise: ["伦理学", "哲学", "社会学"],
    bias: "伦理导向",
    responseStyle: "深思熟虑、关注人文",
    isAutoReply: true,
  },
  {
    name: "产业分析师",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=analyst",
    prompt:
      "你是一位资深产业分析师，专注于AI商业化应用。你应该：\n1. 分析市场趋势和商业机会\n2. 评估商业模式可行性\n3. 预测产业发展方向\n4. 关注投资价值",
    role: "participant",
    personality: "务实、前瞻性",
    expertise: ["市场分析", "商业战略", "投资评估"],
    bias: "市场导向",
    responseStyle: "数据驱动、重视实效",
    isAutoReply: true,
  },
  {
    name: "社会学家",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=social",
    prompt:
      "你是一位社会学研究者，关注AI对社会的影响。你应该：\n1. 分析社会变革趋势\n2. 研究群体行为变化\n3. 评估社会风险\n4. 关注社会公平",
    role: "participant",
    personality: "观察敏锐、同理心强",
    expertise: ["社会学", "人类学", "心理学"],
    bias: "社会公平",
    responseStyle: "全面、关注细节",
    isAutoReply: true,
  },
];

function App() {
  const [agents, setAgents] = useState<Agent[]>(
    DEFAULT_AGENTS.map((agent) => ({
      ...agent,
      id: nanoid(),
    }))
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [discussionStatus, setDiscussionStatus] =
    useState<Discussion["status"]>("paused");
  const [settings, setSettings] = useState<DiscussionSettings>({
    maxRounds: 5,
    temperature: 0.7,
    interval: 3000,
    moderationStyle: "relaxed",
    focusTopics: [],
    allowConflict: true,
  });

  const handleAddAgent = () => {
    const newAgent: Omit<Agent, "id"> = {
      name: `新成员 ${agents.length + 1}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
      prompt: "请在编辑时设置该成员的具体职责和行为方式。",
      role: "participant",
      personality: "待设置",
      expertise: [],
      bias: "待设置",
      responseStyle: "待设置",
      isAutoReply: true,
    };

    const agentWithId = {
      ...newAgent,
      id: nanoid(),
    };

    setAgents((prev) => [agentWithId, ...prev]);
  };

  const handleAgentSubmit = (agentData: Omit<Agent, "id">) => {
    if (editingAgent) {
      // 更新现有代理
      setAgents(
        agents.map((agent) =>
          agent.id === editingAgent.id ? { ...agent, ...agentData } : agent
        )
      );
    } else {
      // 创建新代理
      const newAgent: Agent = {
        ...agentData,
        id: nanoid(),
      };
      setAgents([...agents, newAgent]);
    }
    setEditingAgent(undefined);
    setIsFormOpen(false);
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(agents.filter((agent) => agent.id !== agentId));
  };

  const handleAutoReplyChange = (agentId: string, isAutoReply: boolean) => {
    setAgents(
      agents.map((agent) =>
        agent.id === agentId ? { ...agent, isAutoReply } : agent
      )
    );
  };

  const handleSendMessage = (
    content: string,
    agentId: string,
    type: Message["type"] = "text",
    replyTo?: string
  ) => {
    const newMessage: Message = {
      id: nanoid(),
      agentId,
      content,
      type,
      timestamp: new Date(),
      replyTo,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const getAgentName = (agentId: string) => {
    return agents.find((agent) => agent.id === agentId)?.name || "未知";
  };

  const getAgentAvatar = (agentId: string) => {
    return agents.find((agent) => agent.id === agentId)?.avatar || "";
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        isDarkMode ? "dark bg-gray-900" : "bg-gray-50"
      )}
    >
      <div className="flex-1 container mx-auto p-4 max-w-[1920px] flex flex-col">
        <header className="flex-none py-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
              多Agent讨论系统
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              创建和管理你的AI讨论成员
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            {isDarkMode ? "🌞" : "🌙"}
          </button>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 min-h-0">
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
              <AgentList
                agents={agents}
                onAddAgent={handleAddAgent}
                onEditAgent={(agent) => {
                  setEditingAgent(agent);
                  setIsFormOpen(true);
                }}
                onDeleteAgent={handleDeleteAgent}
                onAutoReplyChange={handleAutoReplyChange}
              />
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4">
              <DiscussionController
                agents={agents}
                onSendMessage={handleSendMessage}
                settings={settings}
                onSettingsChange={setSettings}
                status={discussionStatus}
                onStatusChange={setDiscussionStatus}
              />
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <ChatArea
                messages={messages}
                agents={agents}
                onSendMessage={(content, agentId) =>
                  handleSendMessage(content, agentId)
                }
                getAgentName={getAgentName}
                getAgentAvatar={getAgentAvatar}
              />
            </div>
          </div>
        </div>
      </div>

      <AgentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAgentSubmit}
        initialData={editingAgent}
      />
    </div>
  );
}

export default App;
