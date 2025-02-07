import { Slider } from "@/components/ui/slider";
import { SettingItem } from "./SettingItem";

interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

export function SettingSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  formatValue = (v) => v.toString(),
}: SettingSliderProps) {
  return (
    <SettingItem label={label} description={description}>
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="w-[120px]"
        />
        <div className="w-12 text-sm text-right">
          {formatValue(value)}
          {unit}
        </div>
      </div>
    </SettingItem>
  );
} 