import { IsEmail, IsInt, IsNotEmpty, IsString } from "class-validator";

export class registerDto {
    @IsString()
    @IsNotEmpty()
    declare username: string;

    @IsEmail()
    @IsNotEmpty()
    declare email: string;
    
    @IsString()
    @IsNotEmpty()
    declare password: string;

    @IsInt()
    @IsNotEmpty()
    declare code: number;

    @IsInt()
    @IsNotEmpty()
    declare otp: number;
}
