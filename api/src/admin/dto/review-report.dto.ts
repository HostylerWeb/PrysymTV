import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AdminReportAction {
  dismiss = 'dismiss',
  delete_content = 'delete_content',
  ban_user = 'ban_user',
}

export class ReviewReportDto {
  @IsEnum(AdminReportAction)
  action!: AdminReportAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
