import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import { LeaveType } from "src/common/enums/leave-type.enum";
import { LeaveStatus } from "src/common/enums/leave-status.enum";
import { LeaveModel } from "src/leave/leave.model";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class EmailService {
    constructor(
        private readonly configService: ConfigService,
        @InjectQueue('email')
        private readonly emailQueue: Queue,
        @InjectModel(LeaveModel)
        private readonly leaveModel: typeof LeaveModel,
    ){
        const host = this.configService.get<string>('EMAIL_HOST');
        console.log('---DEBUG: Loaded HOST from .env', host);
        if(!host){
            console.error('CRITICAL: EMAIL_HOST is undefined. Check .env file');
        }
    }

    emailTransport(){
        return nodemailer.createTransport({
            host: this.configService.get<string>('EMAIL_HOST'),
            port: Number(this.configService.get('EMAIL_PORT')),
            secure: false,
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASSWORD'),
            }
        });
    }

    async sendOtp(email: string, otp: number){
        await this.emailQueue.add('send-otp', {email, otp});
        return {
            success: true,
            message: 'OTP Queued Seuccessfully.'
        }; 
    }

    async postLeave({ leaveId, userId, start, end, leaveType, reason }: 
    { leaveId: number, userId: number; start: string; end: string; leaveType: LeaveType; reason: string;}) {
        await this.emailQueue.add('post-leave', {leaveId, userId, start, end, leaveType, reason});
        return {
            success: true,
            message: 'Leave Request Queued Successfully',
        };
    }

    async leaveStatusUpdate(data: { leaveId: number; userId: number; email: string; status: LeaveStatus}){
        await this.emailQueue.add('leave-status-update', data);

        return{
            message: 'Email queue',
        };
    }

    async pendingLeaveReminder(leaves: LeaveModel[]){
        await this.emailQueue.add('pending-leave-reminder', {leaves});
        return {
            message: 'Pending leave reminder queued'
        };
    }

    async hrLeaveStatusUpdate( leaveId: number, userId: number, email: string){
        const leave = await this.leaveModel.findOne({ where: {leaveId}});
        if(!leave){ return {message: 'Error'}}
        const data = {leaveId, userId, email, start: leave.start, end: leave.end, leaveType: leave.leaveType, reason: leave.reason};
        await this.emailQueue.add('hr-leave-status-update', data)
    }
}