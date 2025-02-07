import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { DiscussionSetupPage } from "./discussion-setup-page";

interface DiscussionSetupContainerProps {
  className?: string;
}

export function DiscussionSetupContainer({ className }: DiscussionSetupContainerProps) {
  const { members } = useDiscussionMembers();

  // 如果已经有成员，不显示设置页面
  if (members.length > 0) {
    return null;
  }

  return <DiscussionSetupPage className={className} />;
} 