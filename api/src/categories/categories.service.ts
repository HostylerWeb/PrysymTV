import { Injectable } from '@nestjs/common';
import { ContentVertical } from '@prisma/client';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly platformSettings: PlatformSettingsService) {}

  async listVideoCategories() {
    const programs = await this.platformSettings.getPrograms();
    const general = {
      slug: 'general',
      label: 'General',
      vertical: ContentVertical.general,
    };
    const items = [
      general,
      ...programs
        .filter((p) => p.isActive && p.vertical !== ContentVertical.podcast)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p) => ({
          slug: p.slug,
          label: p.label,
          vertical: p.vertical,
        })),
    ];
    return { items };
  }

  async listPodcastCategories() {
    const items = await this.platformSettings.getPodcastCategories();
    return {
      items: items
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ slug, label }) => ({ slug, label })),
    };
  }

  async listMovieGenres() {
    const items = await this.platformSettings.getMovieGenres();
    return {
      items: items
        .filter((g) => g.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ slug, label }) => ({ slug, label })),
    };
  }
}
