export const USER_GENDER_VALUES = [
  "male",
  "female",
  "non_binary",
  "transgender",
  "prefer_not_to_say",
] as const;

export type UserGenderValue = (typeof USER_GENDER_VALUES)[number];

export const USER_GENDER_OPTIONS: Array<{ value: UserGenderValue; label: string }> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-Binary / Gender Diverse" },
  { value: "transgender", label: "Transgender" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function formatUserGenderLabel(gender: string | null | undefined): string {
  if (!gender) return "Not set";
  return USER_GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? gender;
}
