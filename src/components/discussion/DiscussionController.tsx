import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Agent, Discussion, DiscussionSettings, Message } from '@/types/agent';
import { PauseCircle, PlayCircle, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DiscussionService } from '@/services/discussion.service';
import { cn } from '@/lib/utils';
import { SettingSlider } from './SettingSlider';
import { SettingSelect } from './SettingSelect';
import { SettingSwitch } from './SettingSwitch';

type ModerationStyle = 'strict' | 'relaxed';

const MODERATION_STYLE_OPTIONS: Array<{
  value: ModerationStyle;
  label: string;
}> = [
  { value: 'strict', label: '严格' },
  { value: 'relaxed', label: '宽松' }
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
        onChange={(value) => updateSetting('interval', value * 1000)}
        min={1}
        max={30}
        step={1}
        unit="s"
      />

      <SettingSlider
        label="随机性"
        description="回复内容的创造性和多样性"
        value={settings.temperature}
        onChange={(value) => updateSetting('temperature', value)}
        min={0}
        max={1}
        step={0.1}
        formatValue={(v) => v.toFixed(1)}
      />

      <SettingSelect<ModerationStyle>
        label="主持风格"
        description="主持人引导讨论的方式"
        value={settings.moderationStyle}
        onChange={(value) => updateSetting('moderationStyle', value)}
        options={MODERATION_STYLE_OPTIONS}
      />

      <SettingSwitch
        label="允许冲突"
        description="是否允许参与者之间产生分歧"
        checked={settings.allowConflict}
        onCheckedChange={(checked) => updateSetting('allowConflict', checked)}
      />
    </div>
  );
}

interface DiscussionControllerProps {
  agents: Agent[];
  status: Discussion['status'];
  settings: DiscussionSettings;
  onStatusChange: (status: Discussion['status']) => void;
  onSettingsChange: (settings: DiscussionSettings) => void;
  onSendMessage: (content: string, agentId: string, type: Message['type'], replyTo?: string) => void;
}

export function DiscussionController({
  agents,
  status,
  settings,
  onStatusChange,
  onSettingsChange,
  onSendMessage,
}: DiscussionControllerProps) {
  const [topic, setTopic] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const discussionServiceRef = useRef<DiscussionService>();

  useEffect(() => {
    discussionServiceRef.current = new DiscussionService({
      onMessage: (message: Message) => {
        try {
          onSendMessage(message.content, message.agentId, message.type);
        } catch (error) {
          console.error('消息处理错误:', error);
        }
      },
      onError: (error: Error) => {
        console.error('讨论服务错误:', error);
        onStatusChange('paused');
      }
    });

    return () => discussionServiceRef.current?.stopDiscussion();
  }, []);

  useEffect(() => {
    const service = discussionServiceRef.current;
    if (!service) return;

    const trimmedTopic = topic.trim();
    if (status === 'active' && trimmedTopic) {
      service.startDiscussion(trimmedTopic, agents, settings);
    } else {
      service.stopDiscussion();
    }
  }, [status, topic, agents, settings]);

  const handleStatusChange = () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic && status === 'paused') {
      alert('请先输入讨论主题');
      return;
    }
    onStatusChange(status === 'active' ? 'paused' : 'active');
  };

  const isActive = status === 'active';
  const trimmedTopic = topic.trim();

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button
          onClick={handleStatusChange}
          variant={isActive ? 'destructive' : 'default'}
          size="icon"
          disabled={!trimmedTopic && status === 'paused'}
          className="shrink-0"
        >
          {isActive ? (
            <PauseCircle className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
        </Button>

        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="输入讨论主题，例如：'人工智能对未来教育的影响'"
          className={cn(
            "font-medium transition-all flex-1",
            isActive && "bg-muted"
          )}
          disabled={isActive}
        />

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

      {showSettings && <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />}
    </div>
  );
} 