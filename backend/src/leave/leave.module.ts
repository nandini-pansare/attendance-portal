import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeaveModel } from './leave.model';
import { EmailModule } from 'src/email/email.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ 
    SequelizeModule.forFeature([LeaveModel]), 
    EmailModule,
    AuthModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService]
})
export class LeaveModule {}
 