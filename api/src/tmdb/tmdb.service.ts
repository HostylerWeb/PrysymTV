import {
  BadGatewayException,
  Injectable,
  NotFoundException,
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

export type TmdbMovieCastMember = {
  name: string;
  role: string;
};

export type TmdbMovieDetails = {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string | null;
  tagline: string | null;
  overview: string | null;
  director: string | null;
  writers: string[];
  cast: TmdbMovieCastMember[];
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

type TmdbMovieApiResponse = {
  id: number;
  title?: string;
  tagline?: string | null;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  credits?: {
    cast?: Array<{ name?: string; character?: string; order?: number }>;
    crew?: Array<{ name?: string; job?: string }>;
  };
};

type TmdbJsonLdMovie = {
  '@type'?: string;
  name?: string;
  description?: string;
  image?: string;
  releasedEvent?: Array<{ startDate?: string }>;
};

@Injectable()
export class TmdbService {
  private static readonly IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
  private static readonly SCRAPE_SEARCH_BASE =
    'https://www.themoviedb.org/search/movie';
  private static readonly SCRAPE_MOVIE_BASE =
    'https://www.themoviedb.org/movie';

  private static readonly WRITER_JOBS = new Set([
    'Writer',
    'Screenplay',
    'Story',
    'Characters',
  ]);

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

  async getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      throw new NotFoundException('Invalid TMDB movie id');
    }

    if (this.getLookupMode() === 'scrape') {
      return this.getMovieDetailsScrape(tmdbId);
    }
    return this.getMovieDetailsApi(tmdbId);
  }

  async downloadPoster(
    tmdbId: number,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const details = await this.getMovieDetails(tmdbId);
    if (!details.posterUrl) {
      throw new NotFoundException('TMDB poster not found');
    }

    let res: Response;
    try {
      res = await fetch(details.posterUrl, {
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new BadGatewayException('TMDB poster download failed');
    }
    if (!res.ok) {
      throw new BadGatewayException(`TMDB poster download failed (${res.status})`);
    }

    const contentType =
      res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg';
    const safeName =
      details.title
        .replace(/[^\w-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'movie';

    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType,
      filename: `${safeName}-poster.${ext}`,
    };
  }

  private async getMovieDetailsApi(tmdbId: number): Promise<TmdbMovieDetails> {
    const apiKey = this.config.get<string>('TMDB_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'TMDB API key is not configured. Add TMDB_API_KEY to api/.env or set TMDB_POSTER_LOOKUP_MODE=scrape.',
      );
    }

    const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('append_to_response', 'credits');

    let data: TmdbMovieApiResponse;
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status === 404) {
        throw new NotFoundException('TMDB movie not found');
      }
      if (!res.ok) {
        throw new BadGatewayException(`TMDB movie lookup failed (${res.status})`);
      }
      data = (await res.json()) as TmdbMovieApiResponse;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadGatewayException) {
        throw err;
      }
      throw new BadGatewayException('TMDB movie lookup request failed');
    }

    const crew = data.credits?.crew ?? [];
    const directors = crew
      .filter((member) => member.job === 'Director')
      .map((member) => member.name?.trim())
      .filter(Boolean) as string[];
    const writers = [
      ...new Set(
        crew
          .filter((member) => member.job && TmdbService.WRITER_JOBS.has(member.job))
          .map((member) => member.name?.trim())
          .filter(Boolean) as string[],
      ),
    ];
    const cast = (data.credits?.cast ?? [])
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .slice(0, 12)
      .map((member) => ({
        name: member.name?.trim() || 'Unknown',
        role: member.character?.trim() || 'Cast',
      }))
      .filter((member) => member.name !== 'Unknown');

    return {
      tmdbId: data.id,
      title: data.title?.trim() || 'Untitled',
      releaseYear: this.parseReleaseYear(data.release_date),
      posterUrl: data.poster_path
        ? `${TmdbService.IMAGE_BASE}${data.poster_path}`
        : null,
      tagline: data.tagline?.trim() || null,
      overview: data.overview?.trim() || null,
      director: directors[0] ?? null,
      writers,
      cast,
    };
  }

  private async getMovieDetailsScrape(tmdbId: number): Promise<TmdbMovieDetails> {
    const url = `${TmdbService.SCRAPE_MOVIE_BASE}/${tmdbId}`;
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
      if (res.status === 404) {
        throw new NotFoundException('TMDB movie not found');
      }
      if (!res.ok) {
        throw new BadGatewayException(`TMDB scrape failed (${res.status})`);
      }
      html = await res.text();
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadGatewayException) {
        throw err;
      }
      throw new BadGatewayException('TMDB scrape request failed');
    }

    const parsed = this.parseScrapedMovieHtml(html, tmdbId);
    if (!parsed) {
      throw new NotFoundException('TMDB movie not found');
    }
    return parsed;
  }

  private parseScrapedMovieHtml(
    html: string,
    tmdbId: number,
  ): TmdbMovieDetails | null {
    const jsonLd = this.parseMovieJsonLd(html);
    const originalTitle = html
      .match(/<strong>Original Title<\/strong>\s*([^<]+)/)?.[1]
      ?.trim();
    const tagline =
      html.match(/<h3 class="tagline"[^>]*>([^<]*)<\/h3>/)?.[1]?.trim() || null;
    const overview =
      html.match(/<div class="overview"[^>]*>\s*<p>([^<]*)<\/p>/)?.[1]?.trim() ||
      jsonLd?.description?.trim() ||
      null;
    const posterUrl = jsonLd?.image
      ? this.upgradePosterUrl(jsonLd.image)
      : html.match(/property="og:image" content="([^"]+)"/)?.[1]
        ? this.upgradePosterUrl(
            html.match(/property="og:image" content="([^"]+)"/)![1]!,
          )
        : null;

    const releaseYear =
      this.parseYearFromText(jsonLd?.releasedEvent?.[0]?.startDate ?? '') ??
      this.parseYearFromText(
        html.match(/<span class="tag release_date">\((\d{4})\)<\/span>/)?.[1] ??
          '',
      );

    const title =
      originalTitle ||
      jsonLd?.name?.trim() ||
      html.match(/<title>([^<(]+)/)?.[1]?.trim() ||
      'Untitled';

    const crewSection = html.match(
      /<ol class="people no_image">([\s\S]*?)<\/ol>/,
    )?.[1];
    const { director, writers } = this.parseScrapedCrew(crewSection ?? '');
    const cast = this.parseScrapedCast(html);

    return {
      tmdbId,
      title,
      releaseYear,
      posterUrl,
      tagline: tagline || null,
      overview: overview || null,
      director,
      writers,
      cast,
    };
  }

  private parseMovieJsonLd(html: string): TmdbJsonLdMovie | null {
    const scripts = html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    );
    for (const script of scripts) {
      const raw = (script[1] ?? '')
        .replace(/\/\* <!\[CDATA\[\s*\*\//, '')
        .replace(/\/\* \]\]> \*\//, '')
        .replace(/\s*\*\/\s*$/, '')
        .trim();
      if (!raw.includes('"@type":"Movie"')) continue;
      try {
        const parsed = JSON.parse(raw) as TmdbJsonLdMovie;
        if (parsed['@type'] === 'Movie' || raw.includes('"@type":"Movie"')) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private parseScrapedCrew(section: string): {
    director: string | null;
    writers: string[];
  } {
    const writers = new Set<string>();
    let director: string | null = null;
    const profiles = section.split('<li class="profile">').slice(1);

    for (const profile of profiles) {
      const name = profile
        .match(/<a href="\/person\/[^"]+">([^<]+)<\/a>/)?.[1]
        ?.trim();
      const jobs =
        profile.match(/<p class="character">([^<]*)<\/p>/)?.[1]?.trim() ?? '';
      if (!name) continue;

      if (jobs.includes('Director') && !director) {
        director = name;
      }
      if (
        jobs.includes('Screenplay') ||
        jobs.includes('Story') ||
        jobs.includes('Characters') ||
        jobs.includes('Writer')
      ) {
        writers.add(name);
      }
    }

    return { director, writers: [...writers] };
  }

  private parseScrapedCast(html: string): TmdbMovieCastMember[] {
    const section = html.match(
      /<section class="panel top_billed[\s\S]*?<ol class="people scroller">([\s\S]*?)<\/ol>/,
    )?.[1];
    if (!section) return [];

    const cast: TmdbMovieCastMember[] = [];
    const cards = section.split('<li class="card">').slice(1);

    for (const card of cards) {
      if (card.includes('class="filler view_more"')) continue;
      const name = card
        .match(/<p><a href="\/person\/[^"]+">([^<]+)<\/a><\/p>/)?.[1]
        ?.trim();
      const role = card.match(/<p class="character">([^<]*)<\/p>/)?.[1]?.trim();
      if (!name || !role) continue;
      cast.push({ name, role });
      if (cast.length >= 12) break;
    }

    return cast;
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
    const url = `${TmdbService.SCRAPE_SEARCH_BASE}?query=${encodeURIComponent(query)}`;
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
