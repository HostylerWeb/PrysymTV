/** Call API; on failure return mock/static fallback so UI stays usable offline. */
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
