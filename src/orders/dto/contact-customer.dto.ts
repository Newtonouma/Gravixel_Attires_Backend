import { IsString } from 'class-validator';

export class ContactCustomerDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;
}
