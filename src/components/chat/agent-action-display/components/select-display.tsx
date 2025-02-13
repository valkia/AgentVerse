import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectDisplayProps } from "../types";
import { SelectOptionItem } from "./select-option";

export function SelectDisplay({
  options,
  multiple = false,
  defaultValue,
  onSelect,
  disabled
}: SelectDisplayProps) {
  const [selected, setSelected] = useState<string | string[]>(() => 
    defaultValue || (multiple ? [] : "")
  );

  // 当有默认值时更新选择状态
  useEffect(() => {
    if (defaultValue !== undefined) {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  const handleSelect = (value: string) => {
    if (disabled) return;
    
    if (multiple) {
      setSelected(prev => {
        if (!Array.isArray(prev)) return [value];
        return prev.includes(value) 
          ? prev.filter(v => v !== value)
          : [...prev, value];
      });
    } else {
      setSelected(value);
      onSelect?.(value); // 单选时直接触发
    }
  };

  const handleConfirm = () => {
    if (disabled) return;
    if (!Array.isArray(selected) || selected.length === 0) return;
    onSelect?.(selected);
  };

  return (
    <div className="space-y-2 mt-2">
      {options.map((option) => (
        <SelectOptionItem
          key={option.value}
          option={option}
          isSelected={
            Array.isArray(selected)
              ? selected.includes(option.value)
              : selected === option.value
          }
          isMultiple={multiple}
          disabled={disabled}
          onClick={() => handleSelect(option.value)}
        />
      ))}
      
      {multiple && !disabled && (
        <Button 
          className="mt-2"
          onClick={handleConfirm}
          disabled={!Array.isArray(selected) || selected.length === 0}
        >
          确认选择 ({Array.isArray(selected) ? selected.length : 0})
        </Button>
      )}
    </div>
  );
} 