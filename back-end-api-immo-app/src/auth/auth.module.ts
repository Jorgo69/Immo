/**
 * Module Auth — OTP (téléphone) + JWT.
 */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from './models/user.model/user.model';
import { JwtStrategy } from './strategy/jwt.strategy';
import { OtpStoreService } from './services/otp-store.service';
import { RequestOtpCommandHandler } from './commands/handlers/request-otp.command.handler/request-otp.command.handler';
import { VerifyOtpCommandHandler } from './commands/handlers/verify-otp.command.handler/verify-otp.command.handler';
import { AuthMeHandler } from './queries/handlers/auth-me.handler/auth-me.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserModel]),
  ],
  controllers: [AuthController],
  providers: [
    JwtService,
    JwtStrategy,
    OtpStoreService,
    RequestOtpCommandHandler,
    VerifyOtpCommandHandler,
    AuthMeHandler,
  ],
  exports: [JwtStrategy],
})
export class AuthModule {}
