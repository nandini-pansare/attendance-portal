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

    async register(username: string, email: string, password: string, codeInput: number, otpInput: number){
        try{
            console.log('USER SERVICE HIT');
        
            const code = Number(codeInput);
            const otp = Number(otpInput);

            if(!username || !email || !password || !codeInput || !otpInput){
                throw new BadRequestException('Missing registration fields');
            }

            const existingEmail = await this.userModel.findOne({ where: {email}});
            if(existingEmail){
                throw new BadRequestException('Email already registered!');
            }

            const existingUsername = await this.userModel.findOne({ where: {username}});
            if(existingUsername){
                throw new BadRequestException('Username already taken!');
            }

            console.log('USER EMAIL AND USERNAME VALIDATED');

            const verifyOtp = await this.otpService.verifyOtp(email, otp);
            if(!verifyOtp){
                throw new BadRequestException('Invalid or expired OTP');
            }
            console.log('OTP VERIFIED');
            const hashedPassword = await bcrypt.hash(password, 10);
    
            let role: UserRole;
            if(code === 9876){
                role = UserRole.EMPLOYEE;
            } else if(code === 8765){
                role = UserRole.HR;
            } else if(code === 7654){
                role = UserRole.MANAGER;
            } else{
                throw new BadRequestException('Invalid Registration Code.');
            }
        
            await this.userModel.create({ username, email, password: hashedPassword, role});
            return {
                message: `${role} User Created.`,
            };              
        } catch(error: any){
            console.error('User registration error:', error);
            throw new BadRequestException(error.original?.detail || error.message || 'Invalid registration code'  );
        }
    }
}
