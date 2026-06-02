import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class SendGiftDto {
  @IsString()
  @MinLength(1)
  giftId!: string;

  @IsUUID()
  receiverId!: string;

  @IsOptional()
  @IsUUID()
  streamId?: string;

  @IsOptional()
  @IsUUID()
  videoId?: string;
}
