import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { UpdateOnboardingDraftDto } from './dto/onboarding-draft.dto';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('draft')
  @ApiOperation({ summary: 'Récupérer le brouillon de l\'onboarding (Redis)' })
  async getDraft(@Request() req: { user: { id: string } }) {
    return this.onboardingService.getDraft(req.user.id);
  }

  @Put('draft')
  @ApiOperation({ summary: 'Mettre à jour le brouillon de l\'onboarding (Redis)' })
  async updateDraft(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateOnboardingDraftDto,
  ) {
    return this.onboardingService.updateDraft(req.user.id, dto);
  }

  @Post('finalize')
  @ApiOperation({ summary: 'Finaliser l\'onboarding et sauvegarder dans PostgreSQL' })
  async finalize(@Request() req: { user: { id: string } }) {
    return this.onboardingService.finalizeOnboarding(req.user.id);
  }
}
