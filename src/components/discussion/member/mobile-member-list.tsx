import { SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MemberList } from "./member-list";

interface MobileMemberListProps {
  className?: string;
  onClose?: () => void;
}

export function MobileMemberList({ className }: MobileMemberListProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-none px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <SheetTitle>成员管理</SheetTitle>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <MemberList
          className="h-full"
          headerClassName="px-4"
          listClassName="px-4"
        />
      </div>
    </div>
  );
}
