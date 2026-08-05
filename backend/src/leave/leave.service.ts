import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LeaveModel } from './leave.model';
import { EmailService } from 'src/email/email.service';
import { LeaveStatus } from 'src/common/enums/leave-status.enum';
import { UserRole } from 'src/common/enums/role.enum';
import { Op } from 'sequelize';
import { NotFound } from '@aws-sdk/client-s3';

@Injectable()
export class LeaveService {
    constructor(
        @InjectModel(LeaveModel)
        private readonly leaveModel: typeof LeaveModel,
        private readonly emailService: EmailService,
    ){}

    async postLeave(req, body) {
        const userId = req.user?.userId;
        const email = req.user?.email;
        const { start, end, leaveType, reason } = body;

        const rawStart = typeof start === 'string' ? start.split('T')[0] : new Date(start).toISOString().split('T')[0];
        const rawEnd = typeof end === 'string' ? end.split('T')[0] : new Date(end).toISOString().split('T')[0];
        const [sYear, sMonth, sDay] = rawStart.split('-').map(Number);
        const [eYear, eMonth, eDay] = rawEnd.split('-').map(Number);

        const startDate = new Date(sYear, sMonth - 1, sDay);
        const endDate = new Date(eYear, eMonth - 1, eDay);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            throw new BadRequestException('Please provide valid start and end dates.');
        }

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate > endDate) {
            throw new BadRequestException('Start date cannot be after end date.');
        }

        if (startDate < today) {
            throw new BadRequestException('Leave cannot be requested for a date that has already passed.');
        }

        const existing = await this.leaveModel.findOne({ 
            where: {
                userId, 
                start: rawStart, 
                end: rawEnd, 
                status: { [Op.ne]: LeaveStatus.REJECTED }
            }
        });

        if (existing) {
            throw new BadRequestException('Leave Request Already Registered for Dates.');
        }

        const leave = await this.leaveModel.create({ 
            userId, 
            email, 
            start: rawStart, 
            end: rawEnd, 
            leaveType, 
            reason 
        });

        try {
            await this.emailService.postLeave({
                leaveId: leave.leaveId, 
                userId, 
                start: rawStart, 
                end: rawEnd, 
                leaveType, 
                reason
            });
        } catch (error) {            
            console.error('Failed to queue leave email notification:', error);    
        }

        return { message: 'Leave Request Posted.' };
    }
    
    async listLeave(req: Express.Request){
        const userId = req.user?.userId ?? req.session?.userId;
        if(!userId){
            throw new BadRequestException('User ID is missing from request.');
        }
        const records = await this.leaveModel.findAll({ where: {userId}});
        if(!records || records.length === 0){
           throw new NotFoundException('Records Not Found.');
        }
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
        const role = req.user?.role;
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

    async listPending(req: Express.Request){
        const role = req.user?.role;
        if(role === UserRole.HR){
            const records = await this.leaveModel.findAll({where: {status: LeaveStatus.HR_PENDING}});
            if(!records || records.length === 0){
                return{
                    message: 'No pending requests found.'
                }
            }
            else{
                return {
                    message: 'Records Fetched.',
                    records,
                }
            }
        }
        if(role === UserRole.MANAGER){
            const records = await this.leaveModel.findAll({where: {status: LeaveStatus.PENDING}});
            if(!records || records.length === 0){
                return{
                    message: 'No pending requests found.'
                }
            } else{
                return {
                    message: 'Records Fetched.',
                    records,
                }
            }
        }
        return {
            message: 'Role not recognised.'
        };
    }

    async getUser(id: number){
        const records = await this.leaveModel.findAll({where: {userId: id}});
        if(!records || records.length === 0){
            throw new NotFoundException('No Records Found.')
        }
        return{
            message: 'Records Fetched.',
            data: records,       
        }
    }
}
