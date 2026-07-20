import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Otp } from './otp.model';
import { EmailService } from 'src/email/email.service';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { EmailModule } from 'src/email/email.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { LeaveModel } from 'src/leave/leave.model';

@Module({

    imports: [
        ConfigModule,
        BullModule.registerQueue({
        name: 'email' }),
        SequelizeModule.forFeature([Otp, LeaveModel]),
        EmailModule,
        
    ],
    providers: [OtpService, EmailService,],
    controllers: [OtpController],
    exports: [OtpService]
})
export class OtpModule {}
