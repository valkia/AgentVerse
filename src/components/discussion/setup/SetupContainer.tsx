import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { SetupPage } from "./SetupPage";

interface SetupContainerProps {
  className?: string;
}

export function SetupContainer({ className }: SetupContainerProps) {
  const { members } = useDiscussionMembers();

  // 如果已经有成员，不显示设置页面
  if (members.length > 0) {
    return null;
  }

  return <SetupPage className={className} />;
} 