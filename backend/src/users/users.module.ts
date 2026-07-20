import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { OtpModule } from 'src/otp/otp.module';

@Module({
  imports: [ SequelizeModule.forFeature([User]), OtpModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [SequelizeModule]
})
export class UsersModule {}
