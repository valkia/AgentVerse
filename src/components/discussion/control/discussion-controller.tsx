import { Button } from "@/components/ui/button";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { AgentMessage } from "@/types/discussion";
import { PauseCircle, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useProxyBeanState } from "rx-nested-bean";
import { ClearMessagesButton } from "./clear-messages-button";
import {
  ITypingIndicator,
  typingIndicatorService,
} from "@/services/typing-indicator.service";
import { TypingIndicator } from "../../chat/typing-indicator";
import { agentListResource } from "@/resources";
import { MemberToggleButton } from "../member/member-toggle-button";
import { DiscussionSettingsButton } from "../settings/discussion-settings-button";
import { DiscussionSettingsPanel } from "../settings/discussion-settings-panel";

interface DiscussionControllerProps {
  status: "active" | "paused" | "completed";
  onSendMessage: (params: {
    content: string;
    agentId: string;
    type?: AgentMessage["type"];
    replyTo?: string;
  }) => Promise<AgentMessage | undefined>;
  onToggleMembers?: () => void;
  enableSettings?: boolean;
}

export function DiscussionController({
  status,
  onSendMessage,
  onToggleMembers,
  enableSettings = true,
}: DiscussionControllerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { data: settings, set: setSettings } = useProxyBeanState(
    discussionControlService.store,
    "settings"
  );
  const { members } = useDiscussionMembers();
  const [indicators, setIndicators] = useState<Map<string, ITypingIndicator>>(
    typingIndicatorService.getIndicators()
  );
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    discussionControlService.setMembers(members);
  }, [members]);

  useEffect(() => {
    if (status === "active") {
      const activeMembers = members.filter((m) => m.isAutoReply);
      if (activeMembers.length > 0) {
        discussionControlService.run();
      }
    } else {
      discussionControlService.pause();
    }
  }, [status, members]);

  useEffect(() => {
    return () => {
      discussionControlService.pause();
    };
  }, []);

  useEffect(() => {
    return discussionControlService.onRequestSendMessage$.listen((message) => {
      onSendMessage({
        content: message.content,
        agentId: message.agentId,
        type: message.type,
      });
    });
  }, [onSendMessage]);

  useEffect(() => {
    return typingIndicatorService.onIndicatorsChange$.listen(setIndicators);
  }, []);

  useEffect(() => {
    const sub =
      discussionControlService.env.speakScheduler.messageCounterBean.$.subscribe(
        (count) => setMessageCount(count)
      );
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const isActive = status === "active";

  const getAgentInfo = () => {
    const agents = agentListResource.read().data;
    return {
      getName: (agentId: string) =>
        agents.find((agent) => agent.id === agentId)?.name || agentId,
      getAvatar: (agentId: string) =>
        agents.find((agent) => agent.id === agentId)?.avatar || "",
    };
  };

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (isActive) {
                discussionControlService.pause();
              } else {
                discussionControlService.run();
              }
            }}
            variant={isActive ? "destructive" : "default"}
            size="icon"
            className="shrink-0 transition-all duration-200"
            title={isActive ? "暂停讨论" : "开始讨论"}
          >
            {isActive ? (
              <PauseCircle className="w-5 h-5" />
            ) : (
              <PlayCircle className="w-5 h-5" />
            )}
          </Button>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isActive ? "讨论进行中..." : "讨论已暂停"}
              {isActive && ` (本轮消息: ${messageCount})`}
            </span>
            <div className="ml-2">
              <TypingIndicator
                indicators={indicators}
                getMemberName={getAgentInfo().getName}
                getMemberAvatar={getAgentInfo().getAvatar}
              />
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ClearMessagesButton
            size="icon"
            className="shrink-0"
            variant="secondary"
          />

          {enableSettings && (
            <DiscussionSettingsButton
              isOpen={showSettings}
              onClick={() => setShowSettings(!showSettings)}
            />
          )}

          <MemberToggleButton
            onClick={onToggleMembers}
            memberCount={members.length}
          />
        </div>
      </div>

      {enableSettings && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            showSettings ? "mt-3 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <DiscussionSettingsPanel settings={settings} onSettingsChange={setSettings} />
        </div>
      )}
    </div>
  );
}
