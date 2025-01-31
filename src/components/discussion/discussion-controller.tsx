import { Button } from "@/components/ui/button";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { Discussion, DiscussionSettings, Message } from "@/types/discussion";
import { PauseCircle, PlayCircle, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useProxyBeanState } from "rx-nested-bean";
import { SettingSelect } from "./setting-select";
import { SettingSlider } from "./setting-slider";
import { SettingSwitch } from "./setting-switch";

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
    <div className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
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
  );
}

interface DiscussionControllerProps {
  status: Discussion["status"];
  onSendMessage: (
    content: string,
    agentId: string,
    type: Message["type"],
    replyTo?: string
  ) => void;
}

export function DiscussionController({
  status,
  onSendMessage,
}: DiscussionControllerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { data: settings, set: setSettings } = useProxyBeanState(
    discussionControlService.store,
    "settings"
  );
  const { members } = useDiscussionMembers();

  useEffect(() => {
    discussionControlService.setMembers(members);
  }, [members]);

  useEffect(() => {
    if (status === "active" && discussionControlService.getTopic()) {
      const activeMembers = members.filter(m => m.isAutoReply);
      if (activeMembers.length > 0) {
        discussionControlService.run();
      }
    } else {
      discussionControlService.pause();
    }
  }, [status, members]);

  useEffect(()=>{
    return ()=>{
      discussionControlService.pause();
    }
  },[])

  useEffect(() => {
    return discussionControlService.onMessage$.listen((message) => {
      onSendMessage(message.content, message.agentId, message.type);
    });
  }, [onSendMessage]);

  const isActive = status === "active";

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
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
          className="shrink-0"
        >
          {isActive ? (
            <PauseCircle className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "shrink-0 transition-colors",
            showSettings && "bg-accent text-accent-foreground"
          )}
        >
          <Settings2 className="w-5 h-5" />
        </Button>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}
    </div>
  );
}
