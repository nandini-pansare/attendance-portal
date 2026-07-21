import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { DeviceTokens } from './token.model';
import { InjectModel } from '@nestjs/sequelize';
import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationImage } from './notificationImage.model';
import type {} from 'multer';
import { S3Service } from 'src/aws/s3.service';
import { NotificaionQueueService } from './firebase.queue';

@Injectable() 
export class FirebaseService {
  constructor(
    @InjectModel(DeviceTokens)
    private readonly deviceTokensModel: typeof DeviceTokens,
    @InjectModel(NotificationImage)
    private readonly notificationImageModel: typeof NotificationImage,
    private readonly s3Service: S3Service,
    private readonly notificationQueue: NotificaionQueueService,
  ) {
    if(!getApps().length) {
      initializeApp({
        credential: cert ({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
      });
    }
  }
  
  async testNotification(token: string, title: string, body: string, imageUrl?: string){
    console.log("Notification endpoint hit");

    const notificationUrl = `https://employee-attendance-port-7a0a4.web.app/notification.html?img=${encodeURIComponent(imageUrl ?? "https://employee-attendance-port-7a0a4.web.app/henry-officeAI.png")}`;

    return await getMessaging().send({
      token,
      data: { url: notificationUrl },
      notification: {
        title, body
      }, 
      webpush: {
        notification: {
          title, body, image: 
          imageUrl??
          "https://employee-attendance-port-7a0a4.web.app/henry-officeAI.png"
        },
        fcmOptions: {
          link: notificationUrl,
        },
      },
    });
  }

  async saveToken(req: Express.Request, token: string){
    console.log("Received FRM token:", token);

    //const userId = req.session.userId; 
    const userId = req.user?.userId;

    await this.deviceTokensModel.upsert({userId, token});
    return {
      message: "Token saved successfully",
      token
    };
  }

  async sendPendingLeaveReminder(pendingCount: number){
    const userIds = [10];
    const devices = await this.deviceTokensModel.findAll({ where: {userId: userIds}});
    const tokens = devices.map(device => device.token);

    await this.sendNotification( 
      tokens,
      "Pending Leave Requests",
      `You have ${pendingCount} pending leave request(s) waiting for approval.`
    );
  }

  async sendNotification( tokens: string[], title: string, body: string){
    if(tokens.length === 0){
      return;
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens, notification: {title, body}
    });

    const deadTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if(!res.success && res.error?.code === "messaging/registration-token-not-registered"){
        deadTokens.push(tokens[idx]);
      }
    });
    if(deadTokens.length > 0){
      await this.deviceTokensModel.destroy({ where: {token: deadTokens }});
    }

    return response;
  }


  async sendTestToUser(req: Express.Request, image?: Express.Multer.File){
    const userId = req.user?.userId;
    const device = await this.deviceTokensModel.findOne({
      where: { userId },
      order: [["updatedAt", "DESC"]],
    });

    if (!device) {
      throw new BadRequestException("No registered device found.");
    }

    let imageUrl: string | undefined;
    if (image){
      imageUrl = await this.s3Service.uploadFile(image);
      
      const savedImage = await this.notificationImageModel.create({
        imageUrl,
        mimeType: image.mimetype,
      });

      console.log("Image uploaded to S3:", imageUrl);
      console.log("Database ID:", savedImage.id);
    }
    
    console.log("Sending to device token:", device.token, "for userId: ", userId);
    return await this.notificationQueue.addNotification({
      token: device.token,
      title: "Test Notification",
      body: "Firebase is running.",
      imageUrl,
    });
  }
}
