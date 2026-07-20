import { Module } from '@nestjs/common';
import { FirebaseController } from './firebase.controller';
import { FirebaseService } from './firebase.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeviceTokens } from './token.model';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/user.model';
import { NotificationImage } from './notificationImage.model';
import { S3Service } from 'src/aws/s3.service';
import { BullModule } from '@nestjs/bullmq';
import { NotificaionQueueService } from './firebase.queue';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    SequelizeModule.forFeature([DeviceTokens, User, NotificationImage]), 
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),

    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      }
    }),
    AuthModule
  ],
  controllers: [FirebaseController],
  providers: [FirebaseService, S3Service, NotificaionQueueService, NotificationProcessor],
  exports: [FirebaseService]
})
export class FirebaseModule {}

