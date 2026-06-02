import { IsUUID } from 'class-validator';

export class AttachEpisodeVideoDto {
  @IsUUID()
  videoId!: string;
}
