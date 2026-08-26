export type ProfileCompletionField = 'gender' | 'birthDate' | 'avatar' | 'banner';

export type ProfileCompletionInput = {
  gender?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
};

const FIELD_LABELS: Record<ProfileCompletionField, string> = {
  gender: 'gender',
  birthDate: 'date of birth',
  avatar: 'profile photo',
  banner: 'cover photo',
};

export function getMissingProfileFields(
  user: ProfileCompletionInput | null | undefined,
): ProfileCompletionField[] {
  if (!user) return [];
  const missing: ProfileCompletionField[] = [];
  if (!user.gender?.trim()) missing.push('gender');
  if (!user.birthDate?.trim()) missing.push('birthDate');
  if (!user.avatarUrl?.trim()) missing.push('avatar');
  if (!user.bannerUrl?.trim()) missing.push('banner');
  return missing;
}

export function needsProfileCompletion(
  user: ProfileCompletionInput | null | undefined,
): boolean {
  return getMissingProfileFields(user).length > 0;
}

export function profileCompletionMessage(missing: ProfileCompletionField[]): string {
  if (missing.length === 0) {
    return 'Finish setting up your profile.';
  }
  const labels = missing.map((field) => FIELD_LABELS[field]);
  if (labels.length === 1) {
    return `Finish setting up your profile - add your ${labels[0]}.`;
  }
  const last = labels[labels.length - 1];
  const rest = labels.slice(0, -1).join(', ');
  return `Finish setting up your profile - add your ${rest}, and ${last}.`;
}
