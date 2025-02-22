import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import React from "react";

interface MemberManagementProps {
  className?: string;
}

const AddAgentDialog = React.lazy(() => import("@/components/agent/add-agent-dialog").then(module => ({ default: module.AddAgentDialog })));

export function MemberManagement({ className }: MemberManagementProps) {
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setShowDialog(true)}
        className={cn("h-9 w-9 hover:bg-muted/80", className)}
      >
        <Users className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      <React.Suspense>
        <AddAgentDialog
          isOpen={showDialog}
          onOpenChange={setShowDialog}
        />
      </React.Suspense>
    </>
  );
} 