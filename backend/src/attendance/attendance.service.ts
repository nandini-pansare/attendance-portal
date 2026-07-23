import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AttendanceModel } from './attendance.model';
import { Op } from 'sequelize';
import { Request } from 'express';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/users/user.model';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectModel(AttendanceModel)
        private readonly attendanceModel: typeof AttendanceModel,
        @InjectModel(User)
        private readonly userModel: typeof User,
    ){}

    async today(req: Request){
        const userId = req.session.userId;
        const today = new Date().toISOString().split("T")[0];
        const attendance = await this.attendanceModel.findOne({ where: {userId, date: today}});
        if(!attendance){
            return {                    
                message: 'Not Checked In Yet.'
            };
        }
        if(!attendance.checkOut){
            return {
                message: 'Check In Successful. Not Checked Out Yet.'
            }
        }
        return {                
            message: 'Checked In and Checked Out Successfully.',
            hours: attendance.hours, 
        };  
    }

    async checkIn(req: Request){
        const userId = req.session.userId;        
        
        const today = new Date().toISOString().split("T")[0];
        const exists = await this.attendanceModel.findOne({ where: {userId, date: today}});
        if(exists){
            return {
                message: 'Already Checked In',
            };
        };
        const checkIn = new Date();
        await this.attendanceModel.create({userId, date: today, checkIn, message: 'Checkout Successful!'});
        return {
            message: 'Check In Successful'
        };
    }

    async checkOut(req: Request){
        const userId = req.session.userId;
        const today = new Date().toISOString().split("T")[0];
        const attendance = await this.attendanceModel.findOne({ where: {userId, date: today}});
        if(!attendance){
            return {
                message: 'Not Checked In!'
            };
        }
        if(attendance.checkOut){
            return {
                message: 'Already Checked Out.'
            }
        }
        const checkOut = new Date();
        const hours = (checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);

        attendance.checkOut = checkOut;
        attendance.hours = hours;
        await attendance.save();

        return{ message: 'Check Out Successful!', hours};
    }

    private normalizeDateRangeValue(value: string | Date | undefined): string {
        if (!value) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }

        return value.includes('T') ? value.split('T')[0] : value;
    }

    async getAttendance(req:Request, from: string, to: string){
        const userId = req.session.userId;
        const normalizedFrom = this.normalizeDateRangeValue(from);
        const normalizedTo = this.normalizeDateRangeValue(to);
        const records = await this.attendanceModel.findAll({ where: {
            userId, 
            date: {
                [Op.between]: [normalizedFrom, normalizedTo]
            }},
            order: [['date', 'ASC']]
        });
        if(!Array.isArray(records) || records.length === 0){
            return {
                message: 'Records Not Found!'
            };
        }

        return {
            message: 'Attendance Fetched Successfully!',
            data: records,
        };
    }

    async month(req: Express.Request, month: number, year: number){
        const userId = req.session.userId;

        const mStr = month.toString().padStart(2, '0');
        const lastDay = new Date( year, month, 0).getDate().toString().padStart(2, '0');

        const from = `${year}-${mStr}-01`;
        const to = `${year}-${mStr}-${lastDay}`;

        const records = await this.attendanceModel.findAll({ where: {userId, date: { [Op.between]: [from, to]}}, order: [['date', 'ASC']]});
        if(!Array.isArray(records) || records.length === 0){
            return {
                message: 'Records Not Found!'
            };
        }
        return {
            month, year, records
        };
    }

    async listToday(req: Express.Request){
        const reqRole = req.session.role;
        const today = new Date().toISOString().split("T")[0];
        const clause = reqRole === UserRole.HR?{}:{role: { [Op.in]: [UserRole.MANAGER, UserRole.EMPLOYEE]}};
        const records = await this.attendanceModel.findAll({ 
            where: { date: today }, 
            include: [{
                model: User,
                where: clause,
                attributes: ['userId', 'username', 'role'],
            }],     
        });
        if(!Array.isArray(records) || records.length === 0){
            return {
                message: 'Records Not Found!'
            };
        }
        return {
            message: 'Records Fetched Successfully.',
            records
        };
    }

    async userAttendance(req: Express.Request, id: number){
        const today = new Date().toISOString().split("T")[0];
        const user = await this.userModel.findOne({ where: {userId: id}});
        if(!user){ return {message: 'User Not Found!'}}
        if(user.role === UserRole.HR && req.session.role !== UserRole.HR){
                return {
                    message: 'Access Denied'
                };
            }    
        const records = await this.attendanceModel.findOne({ where: {userId: id, date: today}});
        if(!records){
            return {
                message: 'Records Not Found!'
            };
        } else{
            return {
                records,
            };
        }

    }

    async getList(from: string, to: string){
        const normalizedFrom = this.normalizeDateRangeValue(from);
        const normalizedTo = this.normalizeDateRangeValue(to);
        const records = await this.attendanceModel.findAll({ where: {
            date: {
                [Op.between]: [normalizedFrom, normalizedTo]
            }},
            order: [['date', 'ASC']]
        });
        if(!Array.isArray(records) || records.length === 0){
            return {
                message: 'Records Not Found!'
            };
        }
        return {
            message: 'Attendance Fetched Successfully!',
            data: records,
        };
    }

    async monthList(month: number, year: number){
        const from = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDay = new Date( year, month, 0).getDate();

        const to = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart( 2, '0')}`;

        const records = await this.attendanceModel.findAll({ where: {date: { [Op.between]: [from, to]}}, order: [['date', 'ASC']]});
        if(!Array.isArray(records) || records.length === 0){
            return {
                message: 'Records Not Found!',
            };
        }
        return {
            month, year, records
        };
    }
}
