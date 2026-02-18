/**
 * User Module - Standard 41DEVS
 */
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from '../auth/models/user.model/user.model';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { GetAllHandler } from './queries/handlers/get-all.handler/get-all.handler';
import { FindByIdHandler } from './queries/handlers/find-by-id.handler/find-by-id.handler';
import { GetUserDetailHandler } from './queries/handlers/get-user-detail.handler/get-user-detail.handler';
import { UpdateUserCommandHandler } from './commands/handlers/update-user.command.handler/update-user.command.handler';
import { DeleteUserCommandHandler } from './commands/handlers/delete-user.command.handler/delete-user.command.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserModel]),
  ],
  controllers: [UserController],
  providers: [
    JwtStrategy,
    RolesGuard,
    GetAllHandler,
    FindByIdHandler,
    GetUserDetailHandler,
    UpdateUserCommandHandler,
    DeleteUserCommandHandler,
  ],
})
export class UserModule {}
