import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeaveModel } from 'src/leave/leave.model';

@Module({
    imports: [    
        ConfigModule,
        BullModule.registerQueue({
        name: 'email' }),
        SequelizeModule.forFeature([LeaveModel]),
    ], 
    providers: [EmailService, EmailProcessor],
    exports: [EmailService]
})
export class EmailModule {}
