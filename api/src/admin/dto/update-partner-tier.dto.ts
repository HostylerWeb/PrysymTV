import { CreatorPartnerTier } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePartnerTierDto {
  @IsEnum(CreatorPartnerTier)
  partnerTier!: CreatorPartnerTier;
}
