import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SettingsPanel } from "./settings-panel";
import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useState } from "react";
import { recoverDefaultSettings, settingsResource } from "@/resources/settings.resource";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = async () => {
    await recoverDefaultSettings();
    await settingsResource.list.reload();
    setShowResetConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogTitle
            className="flex items-center justify-between pr-12"
            style={{
              marginTop: "-6px",
            }}
          >
            <span className="text-lg font-medium">设置</span>{" "}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-muted-foreground text-xs hover:text-primary flex items-center gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              恢复默认配置
            </Button>
          </DialogTitle>
          <SettingsPanel />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复默认配置？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将重置所有设置为默认值，且无法撤销。需要刷新页面才能生效。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>确认重置</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
