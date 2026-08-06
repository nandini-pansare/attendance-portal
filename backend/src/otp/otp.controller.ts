import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { GetOtpDto } from './dto/getOtp.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';

@Controller('otp')
export class OtpController {
    constructor(
        private readonly otpService: OtpService,
    ){}

    @Post('portal-get-otp')
    async getOtp(@Body() body: GetOtpDto){
        return this.otpService.getOtp(body.email);
    }

    @Post('verify-otp')
    async verifyOtp(@Body() body: VerifyOtpDto){
        const isValid = await this.otpService.verifyOtp(body.email, body.otp);
        if(!isValid){
            return{
                success: false,
                message: 'Invalid or expired OTP'
            };
        }

        return {success: true};
    }

}
