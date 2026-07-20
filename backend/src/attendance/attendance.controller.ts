import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import * as Express from 'express';
import { SessionGuard } from 'src/guards/session.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import { dateRangeQuerySchema, getListSchema, monthQuerySchema } from '../common/validation/attendance.validation';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permission } from 'src/common/decorators/permissions.decorators';
import { PermissionGuard } from 'src/guards/permission.guard';


@Controller('attendance')
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
    ){}

    @Get('user-view-today')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('VIEW_ATTENDANCE')
    async today(@Req() req: Express.Request){
        return this.attendanceService.today(req);
    }

    @Post('check-in')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('CHECK_IN')
    async checkIn(@Req() req: Express.Request){
        return this.attendanceService.checkIn(req);
    }

    @Post('check-out')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('CHECK_OUT')
    async checkOut(@Req() req: Express.Request){
        return this.attendanceService.checkOut(req);
    }
    
    @Get('user-from-to') //from to
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('USER_GET')
    async toFrom(@Req() req: Express.Request, @Query(new JoiValidationPipe(dateRangeQuerySchema)) query: {from: string; to: string}){
        return this.attendanceService.getAttendance(req, query.from, query.to);
    }

    @Get('user-month')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('USER_GET')
    async month(@Req() req: Express.Request, @Query(new JoiValidationPipe(monthQuerySchema)) query: { month: number; year: number }){
        return this.attendanceService.month(req, query.month, query.year);
    }

    // hr/man
    @Get('list-today')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('ALL_ATTENDANCE')
    async listToday(@Req() req: Express.Request){
        return this.attendanceService.listToday(req);
    }

    @Get('list-from-to') //from to 
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('GET_LIST')
    async getList(@Query(new JoiValidationPipe(getListSchema)) query: { from: string; to: string }){
        return this.attendanceService.getList(query.from, query.to);
    }

    @Get('list-month') //month
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('GET_LIST')
    async monthList(@Query(new JoiValidationPipe(monthQuerySchema)) query: { month: number; year: number }){
        return this.attendanceService.monthList(query.month, query.year);
    }

    @Get(':id')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('GET_ID')
    async userAttendance(@Req() req: Express.Request, @Param('id') id: number){
        return this.attendanceService.userAttendance(req, id);
    }
}
