import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum StreamerApplicationAction {
  approve = 'approve',
  reject = 'reject',
}

export class ReviewStreamerApplicationDto {
  @IsEnum(StreamerApplicationAction)
  action!: StreamerApplicationAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
