import { IsEmail, IsString } from 'class-validator';

export class resetPasswordDto {

    @IsString()
    declare password: string;

    @IsEmail()
    declare email: string;
}