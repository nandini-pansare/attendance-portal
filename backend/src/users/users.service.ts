import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/role.enum';
import { OtpService } from 'src/otp/otp.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User,
        private readonly otpService: OtpService,
    ){}

    async register(username: string, email: string, password: string, code: number, otp: number){
        const existingUser = await this.userModel.findOne({ where: {username}});
        if (existingUser){
            throw new BadRequestException('Username already exists!');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyOtp = await this.otpService.verifyOtp(email, otp);
        if(!verifyOtp){
            throw new BadRequestException('Invalid Otp');
        }
        if(code === 9876){
            await this.userModel.create({ username, email, password: hashedPassword });
            return {
                message: 'Employee User Created.'
            };
        } else if(code===8765) {
            await this.userModel.create({ username, email, password: hashedPassword, role: UserRole.HR});
            return {
                message: 'HR User Created!'
            };
        } else if(code===7654){ 
            await this.userModel.create({ username, email, password: hashedPassword, role: UserRole.MANAGER});
            return {
                message: 'Manager User Created!'
            };              
        }
    }
}
