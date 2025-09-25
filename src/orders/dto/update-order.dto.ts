import { IsOptional, IsString, IsArray, IsIn } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  products?: any[];

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'processing', 'completed'])
  status?: string;
}
