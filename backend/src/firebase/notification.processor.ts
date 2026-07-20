import { Processor, WorkerHost } from "@nestjs/bullmq";
import { FirebaseService } from "./firebase.service";

@Processor('notifications')
export class NotificationProcessor extends WorkerHost{

    constructor(
        private readonly firebaseService: FirebaseService,
    ){
        super();
    }

    async process(job: any){
        console.log("Processing notification job:", job.id);

        await this.firebaseService.testNotification(
            job.data.token,
            job.data.title,
            job.data.body,
            job.data.imageUrl
        );
    }
}