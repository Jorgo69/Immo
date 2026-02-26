import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, ValidateIf } from 'class-validator';

export enum KycReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ReviewKycCommand {
  user_id: string; // Renseigné depuis les params du contrôleur

  @ApiProperty({ description: 'Action (approve, reject)', enum: KycReviewAction })
  @IsEnum(KycReviewAction)
  @IsNotEmpty()
  action: KycReviewAction;

  @ApiProperty({ description: 'Raison du rejet', required: false })
  @IsOptional()
  @ValidateIf((o) => o.action === KycReviewAction.REJECT)
  @IsNotEmpty({ message: 'La raison du rejet est requise si l\'action est reject' })
  rejection_reason?: string;
}
