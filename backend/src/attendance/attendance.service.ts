import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AttendanceModel } from './attendance.model';
import { Op } from 'sequelize';
import { Request } from 'express';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/users/user.model';
import { EditAttendanceDto } from './dto/edit-attendance.dto';

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
                message: 'Not Checked In Yet.',
                checkIn: null,
                checkOut: null,
                hours: null 
            };
        }

        return {
            message: attendance.checkOut
                ? 'Checked In and Checked Out Successfully.'
                : 'Checked In Successfully. Not Checked Out Yet.',
            checkIn: attendance.checkIn,
            checkOut: attendance.checkOut,
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
        if(!attendance.checkIn){
            throw new BadRequestException('Cannot check out without a valid check-in time.');
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
            throw new NotFoundException('Records Not Found!');
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
            throw new NotFoundException('Records Not Found!');
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
            throw new NotFoundException('Records Not Found!');
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
        if(user.role === UserRole.HR && req.user?.role !== UserRole.HR){
                return {
                    message: 'Access Denied'
                };
            }    
        const records = await this.attendanceModel.findOne({ where: {userId: id, date: today}});
        if(!records){
            throw new NotFoundException('Records Not Found!');
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
            throw new NotFoundException('Records Not Found!');
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
            throw new NotFoundException('Records Not Found!');
        }
        return {
            month, year, records
        };
    }

    async editAttendance(req: Express.Request, body: EditAttendanceDto){
        const userId = req.session.userId;
        const today = new Date().toISOString().split("T")[0];

        if(body.date > today){
            throw new BadRequestException('Cannot edit attendace for a future date.');
        }

        let attendance = await this.attendanceModel.findOne({where: {userId, date: body.date}}); 
        
        if(!attendance){
            return{
                message: 'No attendance record found. Create new record?',
                showButton: false,
            }
        }

        const applyTime = (timeStr: string) =>{
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date(`${body.date}T00:00:00`);
            d.setHours(h, m, 0, 0);
            return d;
        };

        if(body.checkIn){
            attendance.checkIn = applyTime(body.checkIn);
        }
        if(body.checkOut){
            attendance.checkOut = applyTime(body.checkOut);
        }

        if(attendance.checkIn && attendance.checkOut){
            if(attendance.checkOut <= attendance.checkIn){
                throw new BadRequestException('Check-out time must be after check-in time');
            }
            const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
            attendance.hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        await attendance.save();

        return{
            message: 'Attendance updated successfuly.',
            showButton: true,
            checkIn: attendance.checkIn,
            checkOut: attendance.checkOut,
            hours: attendance.hours,
        };
    }


    async createRecord(req: Express.Request, body){
        const userId = req.user?.userId;
        if(!userId){
            throw new BadRequestException('Unable to identify user. Please login again.');
        }

        const { date, checkIn, checkOut } = body;
        if(!date){
            throw new BadRequestException('Date is required.');
        }

        const normalizedDate = this.normalizeDateRangeValue(date);
        const existing = await this.attendanceModel.findOne({ where: { userId, date: normalizedDate }});

        if(existing){
            throw new BadRequestException('Attendance record already exists for this date.');
        }

        const parseTime = (time?: string) => {
            if(!time) return null;
            const [hours, minutes] = time.split(':').map(Number);
            if(Number.isNaN(hours) || Number.isNaN(minutes)){
                throw new BadRequestException('Invalid time format.');
            }
            const d = new Date(`${normalizedDate}T00:00:00`);
            d.setHours(hours, minutes, 0, 0);
            return d;
        };

        const checkInDate = parseTime(checkIn);
        const checkOutDate = parseTime(checkOut);

        let hours: number | null = null;
        if(checkInDate && checkOutDate){
            if(checkOutDate <= checkInDate){
                throw new BadRequestException('Check-out time must be after check-in time.');
            }
            hours = Number(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2));
        }

        const record = await this.attendanceModel.create({
            userId,
            date: normalizedDate,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            hours,
        });

        return {
            message: 'Attendance record created successfully.',
            record,
        };
    }
}
