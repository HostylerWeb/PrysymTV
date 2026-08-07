import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TmdbPosterLookupMode = 'api' | 'scrape';

export type TmdbMoviePosterResult = {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string;
  overview: string | null;
};

type TmdbSearchResponse = {
  results?: Array<{
    id: number;
    title?: string;
    poster_path?: string | null;
    release_date?: string;
    overview?: string;
  }>;
};

@Injectable()
export class TmdbService {
  private static readonly IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
  private static readonly SCRAPE_BASE =
    'https://www.themoviedb.org/search/movie';

  constructor(private readonly config: ConfigService) {}

  getLookupMode(): TmdbPosterLookupMode {
    const raw = this.config.get<string>('TMDB_POSTER_LOOKUP_MODE')?.trim();
    return raw?.toLowerCase() === 'scrape' ? 'scrape' : 'api';
  }

  isConfigured(): boolean {
    if (this.getLookupMode() === 'scrape') return true;
    return Boolean(this.config.get<string>('TMDB_API_KEY')?.trim());
  }

  async searchMoviePosters(query: string): Promise<TmdbMoviePosterResult[]> {
    const q = query.trim();
    if (!q) return [];

    if (this.getLookupMode() === 'scrape') {
      return this.searchMoviePostersScrape(q);
    }
    return this.searchMoviePostersApi(q);
  }

  private async searchMoviePostersApi(
    query: string,
  ): Promise<TmdbMoviePosterResult[]> {
    const apiKey = this.config.get<string>('TMDB_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'TMDB API key is not configured. Add TMDB_API_KEY to api/.env or set TMDB_POSTER_LOOKUP_MODE=scrape.',
      );
    }

    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('include_adult', 'false');

    let data: TmdbSearchResponse;
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) {
        throw new BadGatewayException(`TMDB API search failed (${res.status})`);
      }
      data = (await res.json()) as TmdbSearchResponse;
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      throw new BadGatewayException('TMDB API search request failed');
    }

    return (data.results ?? [])
      .filter((item) => item.poster_path)
      .slice(0, 12)
      .map((item) => ({
        tmdbId: item.id,
        title: item.title?.trim() || 'Untitled',
        releaseYear: this.parseReleaseYear(item.release_date),
        posterUrl: `${TmdbService.IMAGE_BASE}${item.poster_path}`,
        overview: item.overview?.trim() || null,
      }));
  }

  private async searchMoviePostersScrape(
    query: string,
  ): Promise<TmdbMoviePosterResult[]> {
    const url = `${TmdbService.SCRAPE_BASE}?query=${encodeURIComponent(query)}`;
    let html: string;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent':
            'Mozilla/5.0 (compatible; PrysymTV/1.0; +https://prysym.tv)',
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        throw new BadGatewayException(`TMDB scrape failed (${res.status})`);
      }
      html = await res.text();
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      throw new BadGatewayException('TMDB scrape request failed');
    }

    return this.parseScrapedSearchHtml(html);
  }

  private parseScrapedSearchHtml(html: string): TmdbMoviePosterResult[] {
    const results: TmdbMoviePosterResult[] = [];
    const chunks = html.split('class="comp:media-card');

    for (let i = 1; i < chunks.length && results.length < 12; i++) {
      const chunk = chunks[i]!;
      if (!chunk.includes('data-media-type="movie"')) continue;

      const idMatch = chunk.match(/href="\/movie\/(\d+)-([^"?#]+)/);
      const posterMatch = chunk.match(
        /class="poster[^"]*"[^>]*src="([^"]+)"/,
      );
      if (!idMatch || !posterMatch) continue;

      const tmdbId = Number.parseInt(idMatch[1]!, 10);
      if (!Number.isFinite(tmdbId)) continue;

      const posterUrl = this.upgradePosterUrl(posterMatch[1]!);
      if (!posterUrl) continue;

      const englishTitle = chunk
        .match(/<span class="font-light">\s*\(([^)]+)\)/)?.[1]
        ?.trim();
      const localizedTitle = chunk
        .match(/<h2[^>]*>[\s\S]*?<span>([^<]*)<\/span>/)?.[1]
        ?.trim();
      const slugTitle = this.titleFromSlug(idMatch[2]!);
      const title =
        englishTitle || localizedTitle || slugTitle || 'Untitled';

      const releaseText =
        chunk.match(/<span class="release_date[^"]*">([^<]*)<\/span>/)?.[1] ??
        '';
      const overview =
        chunk.match(/<div class="mt-4[^"]*">\s*<p>([^<]*)<\/p>/)?.[1]?.trim() ??
        null;

      results.push({
        tmdbId,
        title,
        releaseYear: this.parseYearFromText(releaseText),
        posterUrl,
        overview: overview || null,
      });
    }

    return results;
  }

  private upgradePosterUrl(raw: string): string | null {
    const trimmed = raw.trim();
    const pathMatch = trimmed.match(/\/t\/p\/[^/]+\/(.+)$/);
    if (!pathMatch?.[1]) return null;
    return `${TmdbService.IMAGE_BASE}/${pathMatch[1]}`;
  }

  private titleFromSlug(slug: string): string {
    return slug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private parseReleaseYear(releaseDate?: string): number | null {
    if (!releaseDate?.trim()) return null;
    const year = Number.parseInt(releaseDate.slice(0, 4), 10);
    return Number.isFinite(year) ? year : null;
  }

  private parseYearFromText(text: string): number | null {
    const match = text.match(/\b(18|19|20)\d{2}\b/);
    if (!match) return null;
    const year = Number.parseInt(match[0], 10);
    return Number.isFinite(year) ? year : null;
  }
}
