import { IsDateString, IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { LeaveType } from "src/common/enums/leave-type.enum";

export class postLeaveDto {

    @IsDateString()
    @IsNotEmpty()
    declare start: string;

    @IsDateString()
    @IsNotEmpty()
    declare end: string;

    @IsEnum(LeaveType)
    @IsNotEmpty()
    declare leaveType: LeaveType;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    declare reason: string;

}