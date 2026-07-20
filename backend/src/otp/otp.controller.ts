import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { GetOtpDto } from './dto/getOtp.dto';

@Controller('otp')
export class OtpController {
    constructor(
        private readonly otpService: OtpService,
    ){}

    @Post('portal-get-otp')
    async getOtp(@Body() body: GetOtpDto){
        return this.otpService.getOtp(body.email);
    }

}
