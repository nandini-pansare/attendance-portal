import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeaveModel } from './leave.model';
import { EmailModule } from 'src/email/email.module';
import { AuthModule } from 'src/auth/auth.module';
import { PendingCron } from './scheduler/pending.cron';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [ 
    SequelizeModule.forFeature([LeaveModel]), 
    EmailModule,
    AuthModule,
    FirebaseModule
  ],
  controllers: [LeaveController],
  providers: [LeaveService, PendingCron]
})
export class LeaveModule {}
 