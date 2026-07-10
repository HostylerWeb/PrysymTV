/** Call API; on failure return empty fallback so UI shows empty states instead of fake data. */
export type ApiFallbackResult<T> = {
  data: T;
  fromFallback: boolean;
};

export async function withApiFallbackResult<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<ApiFallbackResult<T>> {
  try {
    return { data: await fetcher(), fromFallback: false };
  } catch {
    return { data: fallback, fromFallback: true };
  }
}

export async function withApiFallback<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const result = await withApiFallbackResult(fetcher, fallback);
  return result.data;
}
