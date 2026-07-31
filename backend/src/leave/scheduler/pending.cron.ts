import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { LeaveModel } from "../leave.model";
import { Cron } from "@nestjs/schedule";
import { LeaveStatus } from "src/common/enums/leave-status.enum";
import { EmailService } from "src/email/email.service";
import { FirebaseService } from "src/firebase/firebase.service";

@Injectable()
export class PendingCron{
    constructor(
        @InjectModel(LeaveModel)
        private readonly leaveModel: typeof LeaveModel,
        private readonly emailService: EmailService,
        private readonly firebaseService: FirebaseService,
    ){}

    @Cron('* 8 * * *')
    async pendingLeaveRequests(){
        const pending = await this.leaveModel.findAll({ where: {status: LeaveStatus.HR_PENDING}});

        console.log('Running Cron');

        if (pending.length === 0){
            return;
        }

        await this.emailService.pendingLeaveReminder(pending);
        
        await this.firebaseService.sendPendingLeaveReminder(pending.length);
    }
}