import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import React from "react";

interface SettingsFeatureProps {
  className?: string;
}

const SettingsDialog = React.lazy(() => import("@/components/settings/settings-dialog").then(module => ({ default: module.SettingsDialog })));

export function SettingsFeature({ className }: SettingsFeatureProps) {
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className={cn("h-9 w-9 hover:bg-muted/80", className)}
        onClick={() => setShowDialog(true)}
      >
        <Settings className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      <React.Suspense>
        <SettingsDialog
          open={showDialog}
          onOpenChange={setShowDialog}
        />
      </React.Suspense>
    </>
  );
} 