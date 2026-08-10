import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { registerDto } from './dto/register.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Permission } from '@aws-sdk/client-s3';

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

    @Get('all-users-hr')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('ALL_USERS')
    async allUsersHr(){
        return this.userService.allUsersHr()
    }
}