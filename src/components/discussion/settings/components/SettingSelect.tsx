import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingItem } from "./SettingItem";

interface SettingSelectProps<T extends string> {
  label: string;
  description?: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
  }>;
}

export function SettingSelect<T extends string>({
  label,
  description,
  value,
  onChange,
  options,
}: SettingSelectProps<T>) {
  return (
    <SettingItem label={label} description={description}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingItem>
  );
} 