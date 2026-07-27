import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'prysym_recent_searches';
const MAX_RECENT = 6;

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function saveRecentSearch(term: string): Promise<string[]> {
  const trimmed = term.trim();
  if (!trimmed) return loadRecentSearches();
  const next = [trimmed, ...(await loadRecentSearches()).filter((item) => item !== trimmed)].slice(
    0,
    MAX_RECENT,
  );
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}
