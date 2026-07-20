import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from 'bullmq';

@Injectable()
export class NotificaionQueueService{

    constructor(
        @InjectQueue('notifications')
        private readonly notificationQueue: Queue,
    ){}

    async addNotification(data:any){
        return await this.notificationQueue.add('send-notification',data);
    }
}