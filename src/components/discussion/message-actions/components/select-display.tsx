import { useEffect, useState } from "react";
import { SelectDisplayProps } from "../types";
import { SelectOptionItem } from "./select-option";

export function SelectDisplay({
  options,
  multiple = false,
  defaultValue,
  onSelect,
  disabled
}: SelectDisplayProps) {
  const [selected, setSelected] = useState<string | string[]>(
    defaultValue || (multiple ? [] : "")
  );

  // 当 defaultValue 改变时更新选择状态
  useEffect(() => {
    if (defaultValue !== undefined) {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  const handleSelect = (value: string) => {
    if (disabled) return;
    
    let newSelected: string | string[];
    if (multiple) {
      newSelected = Array.isArray(selected) 
        ? selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value]
        : [value];
    } else {
      newSelected = value;
    }
    
    setSelected(newSelected);
    onSelect?.(newSelected);
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
    </div>
  );
} 