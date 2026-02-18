import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileEntity } from './entities/profile.entity';
import { UpdateProfileHandler } from './commands/handlers/update-profile.handler/update-profile.handler';
import { GetProfileByUserHandler } from './queries/handlers/get-profile-by-user.handler/get-profile-by-user.handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([ProfileEntity])],
  controllers: [ProfileController],
  providers: [UpdateProfileHandler, GetProfileByUserHandler],
})
export class ProfileModule {}
