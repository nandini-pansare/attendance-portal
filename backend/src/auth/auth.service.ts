import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.model';
import { SessionModel } from './session.model';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from 'src/otp/otp.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User, 
        private readonly jwtService: JwtService,
        private readonly otpService: OtpService,
    ){}

    async login(username: string, password: string, req: Express.Request){
        const user = await this.userModel.findOne({ where: {username}});
        if(!user){
            throw new BadRequestException('Invalid Credentials! User or Password is invalid');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            throw new BadRequestException('Invalid Credentials!');
        }
        const session = req.session;
        session.userId = user.userId;
        session.role = user.role;
        session.email = user.email;

        const token = this.jwtService.sign({
            userId: user.userId,
            username: user.username,
            role: user.role,
            email: user.email,
        });

        return {
            message: 'Login Successful.',
            user: {
                userId: user.userId,
                username: user.username,
            },
            sessionID: req.sessionID,
            token,
        };
    }

    async logout(req: Express.Request): Promise<{message: string}>{
        const destroy = promisify(req.session.destroy).bind(req.session);
        try{
            await destroy();
            return{ message: 'Logout Successful!'};
        } catch (err){
            throw new BadRequestException('Logout Failed');
        }
    }

    async forgotPassword(email: string){
        const otp = await this.otpService.getOtp(email);
        if(!otp.success){
            const success = false;
            return{
                success            
            };
        } else{
            const success = true;
            return{
                success
            };
        }

    }

    async resetPassword(newPassword: string, email: string){
        const user = await this.userModel.findOne({where: {email}});
        if(!user){
            throw new BadRequestException('Invalid credentials');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        if(hashedPassword === user.password){
            throw new BadRequestException('Password must be new.');
        }
        else{
            try{
                user.password = hashedPassword;
                await user.save();

                return{
                    message: 'Password successfully reset.'
                };
            } catch(error){
                throw new BadRequestException('Reset Failed.');
            }
        }
    }
}