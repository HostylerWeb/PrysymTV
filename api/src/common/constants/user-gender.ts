export const USER_GENDER_VALUES = [
  'male',
  'female',
  'non_binary',
  'transgender',
  'prefer_not_to_say',
] as const;

export type UserGenderValue = (typeof USER_GENDER_VALUES)[number];

export const USER_GENDER_LABELS: Record<UserGenderValue, string> = {
  male: 'Male',
  female: 'Female',
  non_binary: 'Non-Binary / Gender Diverse',
  transgender: 'Transgender',
  prefer_not_to_say: 'Prefer not to say',
};

export function formatUserGenderLabel(
  gender: string | null | undefined,
): string {
  if (!gender) return 'Not set';
  return USER_GENDER_LABELS[gender as UserGenderValue] ?? gender;
}
