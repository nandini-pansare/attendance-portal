import { Process, Processor } from "@nestjs/bull";
import { EmailService } from "./email.service";
import type { Job } from "bull";

@Processor('email')
export class EmailProcessor{
    constructor(
        private readonly emailService: EmailService,
    ){}

    @Process('send-otp')
    async handleSendOtp(job: Job){
        const { email, otp } = job.data;

        const transporter = this.emailService.emailTransport();

        await transporter.sendMail({
            from: process.env.Email_USER,
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP is ${otp}. Please use it to register.`
        });
    }

    @Process('post-leave')
    async handlePostLeave(job: Job){
        const { leaveId, userId, start, end, leaveType, reason } = job.data;

        const transporter = this.emailService.emailTransport();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'nandini.pansare16@gmail.com', //manager email id
            subject: 'New Leave Request',
            text: `To the manager, 
            A new leave request has been submitted.
            Leave Id: ${leaveId}
            Employee ID: ${userId}

            From: ${start}
            To: ${end}
            Type: ${leaveType}
            Reason: ${reason}
            
            Approve:
            PATCH /leave/${leaveId}/approve

            Reject:
            PATCH /leave/${leaveId}/reject
            `,
        });
    }

    @Process('leave-status-update')
    async handleLeaveStatus(job: Job){
        const { leaveId, userId, email, status } = job.data;

        const transporter = this.emailService.emailTransport();

        await transporter.sendMail({ 
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Leave Request Status Update`,
            text:`
            User ${userId}, 
            Your leave request (#${leaveId}) has been ${status}.`
        });
    }

    @Process('pending-leave-reminder')
    async handlePendingLeaveReminder(job: Job){
        const{leaves} = job.data;

        const leaveList = leaves.map((leave)=> `
        Leave Id: ${leave.leaveId}
        Employee Id: ${leave.userId}
        From: ${leave.start}
        Tp: ${leave.end}
        Type: ${leave.leaveType}
        Reason: ${leave.reason}
        ---------------------
        `).join('\n');

        const transporter = this.emailService.emailTransport();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'nandini.pansare16@gmail.com',
            subject: 'Pending Leave Requests',
            text: `
            The following leave requests are peding status update:
            ${leaveList}`,
        });
    }

    @Process('hr-leave-status-update')
    async handleHrLeaveStatusUpdate(job: Job){
        const{leaveId, userId, email, start, end, leaveType, reason } = job.data;
        
        const transporter = this.emailService.emailTransport();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'nandini.pansare16@gmail.com', //hr email id
            subject: 'New Leave Request',
            text: `To the hr, 
            A new leave request has been submitted.
            Leave Id: ${leaveId}
            Employee ID: ${userId}

            From: ${start}
            To: ${end}
            Type: ${leaveType}
            Reason: ${reason}
            
            Approve:
            PATCH /leave/${leaveId}/approve

            Reject:
            PATCH /leave/${leaveId}/reject
            `,
        });
    }
}