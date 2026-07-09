"use client";

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
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </legend>
      <div className="space-y-2">
        {USER_GENDER_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="gender"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              required={required && !value}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
