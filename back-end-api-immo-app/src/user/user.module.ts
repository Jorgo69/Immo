/**
 * User Module - Standard 41DEVS
 */
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from '../auth/models/user.model/user.model';
import { ProfileEntity } from '../profile/entities/profile.entity';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { GetAllHandler } from './queries/handlers/get-all.handler/get-all.handler';
import { FindByIdHandler } from './queries/handlers/find-by-id.handler/find-by-id.handler';
import { GetUserDetailHandler } from './queries/handlers/get-user-detail.handler/get-user-detail.handler';
import { GetAdminStatsHandler } from './queries/handlers/get-admin-stats.handler/get-admin-stats.handler';
import { UpdateUserCommandHandler } from './commands/handlers/update-user.command.handler/update-user.command.handler';
import { DeleteUserCommandHandler } from './commands/handlers/delete-user.command.handler/delete-user.command.handler';
import { CreateUserCommandHandler } from './commands/handlers/create-user.command.handler/create-user.command.handler';
import { UpdateProfileCommandHandler } from './commands/handlers/update-profile.command.handler/update-profile.command.handler';
import { ReviewKycCommandHandler } from './commands/handlers/review-kyc.command.handler/review-kyc.command.handler';
import { ChangeStatusCommandHandler } from './commands/handlers/change-status.command.handler/change-status.command.handler';
import { AssignRbacRoleCommandHandler } from './commands/handlers/assign-rbac-role.command.handler/assign-rbac-role.command.handler';
import { UploadAvatarService } from './upload-avatar.service';
import { UploadIdCardService } from './upload-id-card.service';
import { UserCronService } from './services/user-cron.service';
import { RoleEntity } from '../rbac/entities/role.entity';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserModel, ProfileEntity, RoleEntity])],
  controllers: [UserController],
  providers: [
    UploadAvatarService,
    UploadIdCardService,
    JwtStrategy,
    RolesGuard,
    GetAllHandler,
    FindByIdHandler,
    GetUserDetailHandler,
    GetAdminStatsHandler,
    CreateUserCommandHandler,
    UpdateProfileCommandHandler,
    UpdateUserCommandHandler,
    DeleteUserCommandHandler,
    ReviewKycCommandHandler,
    ChangeStatusCommandHandler,
    AssignRbacRoleCommandHandler,
    UserCronService,
  ],
})
export class UserModule {}
