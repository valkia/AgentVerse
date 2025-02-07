import { Button } from "@/components/ui/button";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { DiscussionSettings, AgentMessage } from "@/types/discussion";
import { PauseCircle, PlayCircle, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useProxyBeanState } from "rx-nested-bean";
import { SettingSelect } from "../settings/setting-select";
import { SettingSlider } from "../settings/setting-slider";
import { SettingSwitch } from "../settings/setting-switch";
import { ClearMessagesButton } from "./clear-messages-button";
import {
  ITypingIndicator,
  typingIndicatorService,
} from "@/services/typing-indicator.service";
import { TypingIndicator } from "../../chat/typing-indicator";
import { agentListResource } from "@/resources";
import { MemberToggleButton } from "../member/member-toggle-button";

type ModerationStyle = "strict" | "relaxed";

const MODERATION_STYLE_OPTIONS: Array<{
  value: ModerationStyle;
  label: string;
}> = [
  { value: "strict", label: "严格" },
  { value: "relaxed", label: "宽松" },
];

interface SettingsPanelProps {
  settings: DiscussionSettings;
  onSettingsChange: (settings: DiscussionSettings) => void;
}

function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const updateSetting = <K extends keyof DiscussionSettings>(
    key: K,
    value: DiscussionSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card/50 p-4">
      <div className="text-sm font-medium text-muted-foreground">讨论设置</div>

      <SettingSlider
        label="回复间隔"
        description="每个Agent之间的回复间隔时间"
        value={settings.interval / 1000}
        onChange={(value) => updateSetting("interval", value * 1000)}
        min={1}
        max={30}
        step={1}
        unit="s"
      />

      <SettingSlider
        label="随机性"
        description="回复内容的创造性和多样性"
        value={settings.temperature}
        onChange={(value) => updateSetting("temperature", value)}
        min={0}
        max={1}
        step={0.1}
        formatValue={(v) => v.toFixed(1)}
      />

      <div className="grid grid-cols-2 gap-4">
        <SettingSelect<ModerationStyle>
          label="主持风格"
          description="主持人引导讨论的方式"
          value={settings.moderationStyle}
          onChange={(value) => updateSetting("moderationStyle", value)}
          options={MODERATION_STYLE_OPTIONS}
        />

        <SettingSwitch
          label="允许冲突"
          description="是否允许参与者之间产生分歧"
          checked={settings.allowConflict}
          onCheckedChange={(checked) => updateSetting("allowConflict", checked)}
        />
      </div>
    </div>
  );
}

interface DiscussionControllerProps {
  status: "active" | "paused" | "completed";
  onSendMessage: (params: {
    content: string;
    agentId: string;
    type?: AgentMessage["type"];
    replyTo?: string;
  }) => Promise<AgentMessage | undefined>;
  onToggleMembers?: () => void;
}

export function DiscussionController({
  status,
  onSendMessage,
  onToggleMembers,
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
    if (status === "active" && discussionControlService.getTopic()) {
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
            variant="ghost"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "shrink-0 transition-all",
              showSettings && "bg-accent text-accent-foreground rotate-180"
            )}
            title="设置"
          >
            <Settings2 className="w-5 h-5" />
          </Button>

          <MemberToggleButton
            onClick={onToggleMembers}
            memberCount={members.length}
          />
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          showSettings ? "mt-3 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <SettingsPanel settings={settings} onSettingsChange={setSettings} />
      </div>
    </div>
  );
}
