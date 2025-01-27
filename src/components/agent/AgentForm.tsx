import { useState } from "react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface AgentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (agent: Omit<Agent, "id">) => void;
  initialData?: Agent;
}

export function AgentForm({ open, onOpenChange, onSubmit, initialData }: AgentFormProps) {
  const [formData, setFormData] = useState<Omit<Agent, "id">>({
    name: initialData?.name || "",
    avatar: initialData?.avatar || "",
    prompt: initialData?.prompt || "",
    role: initialData?.role || "participant",
    personality: initialData?.personality || "",
    expertise: initialData?.expertise || [],
    bias: initialData?.bias || "",
    responseStyle: initialData?.responseStyle || "",
    isAutoReply: initialData?.isAutoReply || true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? "编辑讨论员" : "添加讨论员"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名称
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="avatar" className="text-right">
                头像URL
              </Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                角色
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "moderator" | "participant") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">主持人</SelectItem>
                  <SelectItem value="participant">参与者</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="personality" className="text-right">
                性格特征
              </Label>
              <Input
                id="personality"
                value={formData.personality}
                onChange={(e) =>
                  setFormData({ ...formData, personality: e.target.value })
                }
                placeholder="例如：理性、开放、谨慎"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expertise" className="text-right">
                专业领域
              </Label>
              <Input
                id="expertise"
                value={formData.expertise.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expertise: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                placeholder="用逗号分隔多个领域"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bias" className="text-right">
                倾向性
              </Label>
              <Input
                id="bias"
                value={formData.bias}
                onChange={(e) =>
                  setFormData({ ...formData, bias: e.target.value })
                }
                placeholder="例如：保守派、创新派"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responseStyle" className="text-right">
                回复风格
              </Label>
              <Input
                id="responseStyle"
                value={formData.responseStyle}
                onChange={(e) =>
                  setFormData({ ...formData, responseStyle: e.target.value })
                }
                placeholder="例如：简洁、详细、幽默"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prompt" className="text-right">
                Prompt
              </Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
                className="col-span-3"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isAutoReply" className="text-right">
                自动回复
              </Label>
              <div className="col-span-3">
                <Switch
                  id="isAutoReply"
                  checked={formData.isAutoReply}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isAutoReply: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 