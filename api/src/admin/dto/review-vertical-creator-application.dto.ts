import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum VerticalCreatorApplicationAction {
  approve = 'approve',
  reject = 'reject',
}

export class ReviewVerticalCreatorApplicationDto {
  @IsEnum(VerticalCreatorApplicationAction)
  action!: VerticalCreatorApplicationAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
