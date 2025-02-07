import { Switch } from "@/components/ui/switch";
import { SettingItem } from "./SettingItem";

interface SettingSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: SettingSwitchProps) {
  return (
    <SettingItem label={label} description={description}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </SettingItem>
  );
} 