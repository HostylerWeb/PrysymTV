import { IsIn, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  packageId!: string;

  @IsIn(['coins', 'premium', 'insider'])
  productType: 'coins' | 'premium' | 'insider' = 'coins';
}
