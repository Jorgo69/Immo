/**
 * DTO de réponse pour une demande de location.
 */
import { ApiProperty } from '@nestjs/swagger';
import { RentalRequestStatus } from '../entities/rental-request.entity';

export class RentalRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  unit_id: string;

  @ApiProperty()
  tenant_id: string;

  @ApiProperty({ enum: RentalRequestStatus })
  status: RentalRequestStatus;

  @ApiProperty({ nullable: true })
  message: string | null;

  @ApiProperty({ nullable: true, description: "Date d'entrée souhaitée" })
  desired_move_in_at: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ nullable: true })
  responded_at: Date | null;

  @ApiProperty({ nullable: true })
  responded_by: string | null;
}
