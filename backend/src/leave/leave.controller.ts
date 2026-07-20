import { Body, Controller, Post, Req, Get, UseGuards, Patch, Param } from '@nestjs/common';
import * as Express from 'express';
import { LeaveService } from './leave.service';
import { postLeaveDto } from './dto/post-leave.dto';
import { SessionGuard } from 'src/guards/session.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import { postLeaveSchema } from 'src/common/validation/leave.validation';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { LeaveStatus } from 'src/common/enums/leave-status.enum';
import { Permission } from 'src/common/decorators/permissions.decorators';
import { PermissionGuard } from 'src/guards/permission.guard';


@Controller('leave')
export class LeaveController {

    constructor(
        private readonly leaveService: LeaveService,
    ){}

    @Post()
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('LEAVE')
    async postLeave(@Req() req: Express.Request, @Body(new JoiValidationPipe(postLeaveSchema)) body: postLeaveDto){
        return this.leaveService.postLeave(req, body);
    }

    @Get()
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('LEAVE')
    async listLeave(@Req() req: Express.Request){
        return this.leaveService.listLeave(req);
    }

    @Get('list-pending')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('LIST_PENDING_REQ')
    async listPending(){
        return this.leaveService.listPending();
    }

    @Get(':id')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('LIST_LEAVES')
    async getUser(@Param('id') id: number){
        return this.leaveService.getUser(id);
    }

    @Patch(':id/approve')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('LEAVE_STATUS')
    async approveLeave(@Req() req: Express.Request, @Param('id') leaveId: number){
        return this.leaveService.updateStatus(req, leaveId, LeaveStatus.APPROVED);
    }

    @Patch(':id/reject')
    @UseGuards(SessionGuard, JwtAuthGuard, PermissionGuard)
    @Permission('LEAVE_STATUS')
    async rejectLeave(@Req() req: Express.Request, @Param('id') leaveId: number){
        return this.leaveService.updateStatus(req, leaveId, LeaveStatus.REJECTED);
    }
}
