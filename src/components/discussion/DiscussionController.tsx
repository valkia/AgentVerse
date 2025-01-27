import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Agent, Discussion, DiscussionSettings, Message } from '@/types/agent';
import { PauseCircle, PlayCircle, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DiscussionService } from '@/services/discussion.service';
import { cn } from '@/lib/utils';

interface DiscussionControllerProps {
  agents: Agent[];
  onSendMessage: (content: string, agentId: string, type: Message['type'], replyTo?: string) => void;
  settings: DiscussionSettings;
  onSettingsChange: (settings: DiscussionSettings) => void;
  status: Discussion['status'];
  onStatusChange: (status: Discussion['status']) => void;
}

export function DiscussionController({
  agents,
  onSendMessage,
  settings,
  onSettingsChange,
  status,
  onStatusChange,
}: DiscussionControllerProps) {
  const [topic, setTopic] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const discussionServiceRef = useRef<DiscussionService>();

  useEffect(() => {
    // 初始化讨论服务
    discussionServiceRef.current = new DiscussionService({
      onMessage: (message: Message) => {
        onSendMessage(message.content, message.agentId, message.type);
      },
      onError: (error: Error) => {
        console.error('Discussion Error:', error);
        onStatusChange('paused');
      }
    });

    return () => {
      // 清理讨论
      if (discussionServiceRef.current) {
        discussionServiceRef.current.stopDiscussion();
      }
    };
  }, []);

  useEffect(() => {
    if (!discussionServiceRef.current) return;

    if (status === 'active' && topic.trim()) {
      discussionServiceRef.current.startDiscussion(topic, agents, settings);
    } else {
      discussionServiceRef.current.stopDiscussion();
    }
  }, [status, topic, agents, settings]);

  const isTopicEmpty = !topic.trim();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => {
            if (isTopicEmpty && status === 'paused') {
              alert('请先输入讨论主题');
              return;
            }
            onStatusChange(status === 'active' ? 'paused' : 'active');
          }}
          variant={status === 'active' ? 'destructive' : 'default'}
          size="icon"
          disabled={isTopicEmpty && status === 'paused'}
          className="shrink-0"
        >
          {status === 'active' ? (
            <PauseCircle className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
        </Button>

        <div className="flex-1">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入讨论主题，例如：'人工智能对未来教育的影响'"
            className={cn(
              "font-medium transition-all",
              status === 'active' && "bg-muted"
            )}
            disabled={status === 'active'}
          />
        </div>

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
        <div className="space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>回复间隔</Label>
                <p className="text-sm text-muted-foreground">
                  每个Agent之间的回复间隔时间
                </p>
              </div>
              <div className="flex items-center gap-2 min-w-[240px]">
                <Slider
                  value={[settings.interval / 1000]}
                  onValueChange={(value) =>
                    onSettingsChange({ ...settings, interval: value[0] * 1000 })
                  }
                  min={1}
                  max={30}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-sm text-muted-foreground">
                  {settings.interval / 1000}s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>随机性</Label>
                <p className="text-sm text-muted-foreground">
                  回复内容的创造性和多样性
                </p>
              </div>
              <div className="flex items-center gap-2 min-w-[240px]">
                <Slider
                  value={[settings.temperature]}
                  onValueChange={(value) =>
                    onSettingsChange({ ...settings, temperature: value[0] })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="w-12 text-sm text-muted-foreground">
                  {settings.temperature.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>主持风格</Label>
                <p className="text-sm text-muted-foreground">
                  主持人引导讨论的方式
                </p>
              </div>
              <Select
                value={settings.moderationStyle}
                onValueChange={(value: 'strict' | 'relaxed') =>
                  onSettingsChange({ ...settings, moderationStyle: value })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">严格</SelectItem>
                  <SelectItem value="relaxed">宽松</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>允许冲突</Label>
                <p className="text-sm text-muted-foreground">
                  是否允许参与者之间产生分歧
                </p>
              </div>
              <Switch
                checked={settings.allowConflict}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, allowConflict: checked })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 