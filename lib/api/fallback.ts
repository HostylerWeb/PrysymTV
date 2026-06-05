/** Call API; on failure return empty fallback so UI shows empty states instead of fake data. */
export async function withApiFallback<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fetcher();
  } catch {
    return fallback;
  }
}
