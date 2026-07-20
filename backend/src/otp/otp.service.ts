import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as crypto from 'crypto';
import { Otp } from './otp.model';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class OtpService {
    constructor(
        @InjectModel(Otp)
        private readonly otpModel: typeof Otp,
        private readonly emailService: EmailService,
    ){}

    async getOtp(email: string){
        const otp = crypto.randomInt(100000, 999999);
        const expiresAt = new Date(Date.now()+ 5 * 60 * 1000);

        try{
            const existing = await this.otpModel.findOne({ where: { email}});
            if(existing){
                existing.otp = otp;
                existing.expiresAt = expiresAt;
                await existing.save();
            } else{
                await this.otpModel.create({ email, otp, expiresAt});
            }

            await this.emailService.sendOtp(email, otp);
            
            return {
                message: 'Otp Generated SucessFully. Please check your email.'
            };

        } catch(error){
            throw new InternalServerErrorException('Error saving verification code to database');
        }
    }

    async verifyOtp( email: string, otp: number){
        const record = await this.otpModel.findOne({ where: { email }});
        if(!record){
            console.log('Record False');
            return false;
        }
        if(record.otp !== otp){
            console.log('Invalid Otp');
            return false;
        }
        if(new Date()> record.expiresAt){
            console.log('Otp Expired');
            return false;
        }
        
        return true; 
    }
}
