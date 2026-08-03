"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_GENDER_OPTIONS, type UserGenderValue } from "@/lib/user-gender";

type Props = {
  value: UserGenderValue | "";
  onChange: (value: UserGenderValue) => void;
  required?: boolean;
  label?: string;
};

export function GenderField({
  value,
  onChange,
  required = false,
  label = "Gender",
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <Select
        value={value || undefined}
        onValueChange={(next) => onChange(next as UserGenderValue)}
        required={required}
      >
        <SelectTrigger className="h-12 w-full rounded-xl bg-secondary border-0 shadow-none">
          <SelectValue placeholder="Select gender" />
        </SelectTrigger>
        <SelectContent>
          {USER_GENDER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
