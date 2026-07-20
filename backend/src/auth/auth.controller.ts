import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { loginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import * as Express from 'express';
import { SessionGuard } from 'src/guards/session.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ){}

    @Post('portal-login')
    async login(@Req() req: Express.Request, @Body() body: loginDto){
        return this.authService.login(body.username, body.password, req);
    }

    @Post('portal-logout')
    @UseGuards(SessionGuard, JwtAuthGuard)
    async logout(@Req() req: Express.Request){
        return this.authService.logout(req);
    }
}


