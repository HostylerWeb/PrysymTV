import { IsInt } from 'class-validator';

export class AdjustUserCoinsDto {
  @IsInt()
  delta!: number;
}
