import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { UpdateOnboardingDraftDto } from './dto/onboarding-draft.dto';
import { GetOnboardingDraftQuery } from './queries/impl/get-onboarding-draft.query';
import { UpdateOnboardingDraftCommand } from './commands/impl/update-onboarding-draft.command';
import { FinalizeOnboardingCommand } from './commands/impl/finalize-onboarding.command';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('draft')
  @ApiOperation({ summary: 'Récupérer le brouillon onboarding actuel (Redis ou DB)' })
  async getDraft(@Req() req) {
    return this.queryBus.execute(new GetOnboardingDraftQuery(req.user.id));
  }

  @Post('draft')
  @ApiOperation({ summary: 'Mettre à jour le brouillon onboarding (Redis)' })
  async updateDraft(@Req() req, @Body() dto: UpdateOnboardingDraftDto) {
    return this.commandBus.execute(new UpdateOnboardingDraftCommand(req.user.id, dto));
  }

  @Post('finalize')
  @ApiOperation({ summary: 'Finaliser l’onboarding (Transfert Redis -> DB)' })
  async finalize(@Req() req) {
    return this.commandBus.execute(new FinalizeOnboardingCommand(req.user.id));
  }
}
