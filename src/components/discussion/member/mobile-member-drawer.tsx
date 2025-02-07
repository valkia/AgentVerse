import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MobileMemberList } from "./mobile-member-list";

interface MobileMemberDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMemberDrawer({
  open,
  onOpenChange,
}: MobileMemberDrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <MobileMemberList />
      </SheetContent>
    </Sheet>
  );
}
