/**
 * Auth Controller — OTP (téléphone) puis JWT.
 */
import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestOtpCommand } from './commands/impl/request-otp.command/request-otp.command';
import { VerifyOtpCommand } from './commands/impl/verify-otp.command/verify-otp.command';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
import { AuthMeQuery } from './queries/impl/auth-me.query/auth-me.query';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Demander un code OTP (envoyé par SMS/WhatsApp)' })
  async requestOtp(@Body() command: RequestOtpCommand) {
    return this.commandBus.execute(command);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Vérifier l’OTP et obtenir le token JWT (création user si premier passage)' })
  async verifyOtp(@Body() command: VerifyOtpCommand) {
    return this.commandBus.execute(command);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Infos de l’utilisateur connecté' })
  async me(@Request() req: { user: { id: string } }) {
    const query = new AuthMeQuery();
    query.userId = req.user.id;
    return this.queryBus.execute(query);
  }
}
