import { Body, Controller, Get, NotFoundException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type {} from 'multer';


@Controller('notifications')
export class FirebaseController {

    constructor(
        private readonly firebaseService: FirebaseService,
    ){}
    
    @Post('test')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async testNotification(@Req() req: Express.Request, @UploadedFile() image?: Express.Multer.File,){
        return await this.firebaseService.sendTestToUser(req, image);
    }

    @Post('register')
    @UseGuards(JwtAuthGuard)
    async registerToken(@Req() req: Express.Request, @Body() body: {token: string}){
        return this.firebaseService.saveToken(req, body.token);
    }
}
