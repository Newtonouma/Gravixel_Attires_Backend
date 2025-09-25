import { IsString, IsEmail, IsArray, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  products: any[];
}
