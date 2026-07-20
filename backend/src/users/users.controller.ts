import { Body, Controller, Post } from '@nestjs/common';
import { registerDto } from './dto/register.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UsersService,
    ){}

    // emp - 9876, hr - 8765, manager - 7654
    @Post('portal-register')
    async register(@Body() body: registerDto){
        return this.userService.register(body.username, body.email, body.password, body.code, body.otp);
    }
}