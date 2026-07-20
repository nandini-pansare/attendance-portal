import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LeaveModel } from './leave.model';
import { EmailService } from 'src/email/email.service';
import { LeaveStatus } from 'src/common/enums/leave-status.enum';
import { UserRole } from 'src/common/enums/role.enum';
import { Op } from 'sequelize';

@Injectable()
export class LeaveService {
    constructor(
        @InjectModel(LeaveModel)
        private readonly leaveModel: typeof LeaveModel,
        private readonly emailService: EmailService,
    ){}

    async postLeave(req, body){
        const userId = req.session.userId;
        const email = req.session.email;
        const { start, end, leaveType, reason } = body;

        if (new Date(start) > new Date(end)){
            throw new Error("Start date cannot be after end date");
        }
        const existing = await this.leaveModel.findOne({ where: {userId, start, end, status: {[Op.ne] : LeaveStatus.REJECTED}}});
        if(existing){
            throw new BadRequestException('Leave Request Already Registered for Dates.');
        }
        const leave = await this.leaveModel.create({userId, email, start, end, leaveType, reason });
        await this.emailService.postLeave({leaveId: leave.leaveId, userId, start, end, leaveType, reason});
        return {
            message: 'Leave Request Posted.'
        }
    }
    
    async listLeave(req: Express.Request){
        const userId = req.session.userId;
        const records = await this.leaveModel.findAll({ where: {userId}});
        return {
            message: 'Fetched Records Successfully',
            data: records,
        };
    }

    async updateStatus(req: Express.Request, leaveId: number, status: LeaveStatus){
        const leave = await this.leaveModel.findByPk(leaveId);
        if(!leave){
            throw new NotFoundException('Leave Request Not Found.');
        }
        const role = req.session.role;
        if(role === UserRole.HR && leave.status === LeaveStatus.HR_PENDING){
            leave.status = status;
            await leave.save();

            await this.emailService.leaveStatusUpdate({
                leaveId: leave.leaveId,
                userId: leave.userId,
                email: leave.email,
                status: leave.status
            });
            
            return {
                message: `Leave request ${status}`
            };
        } 

        else if(role === UserRole.MANAGER && leave.status === LeaveStatus.PENDING){
            if(status === LeaveStatus.REJECTED){
                leave.status = status;
                await leave.save();
                await this.emailService.leaveStatusUpdate({
                    leaveId: leave.leaveId,
                    userId: leave.userId,
                    email: leave.email,
                    status: leave.status
                });
                return {
                    message: `Leave request rejected`
                };
            }
            if(status === LeaveStatus.APPROVED){
                status = LeaveStatus.HR_PENDING;
                leave.status = status;
                await leave.save();
                await this.emailService.hrLeaveStatusUpdate( leave.leaveId, leave.userId, leave.email);
                return {
                    message: `Leave request approved by manager and pending hr approval.`
                };
            }
        }
        else if(role === UserRole.HR && leave.status === LeaveStatus.PENDING){
            return{
                message: 'Request is Pending Manager Approval.'
            }
        }
        else {
            return{
                message: 'Request Status Already Updated'
            };
        }
    }

    async listPending(){
        const today = new Date().toISOString().split("T")[0];
        return this.leaveModel.findAll({where: {status: LeaveStatus.PENDING}});
    }
    
    async getUser(id: number){
        return this.leaveModel.findAll({where: {userId: id}});
    }
}
