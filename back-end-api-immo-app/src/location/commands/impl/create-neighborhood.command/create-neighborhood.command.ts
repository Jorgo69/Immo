import { ICommand } from '@nestjs/cqrs';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNeighborhoodCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  city_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
