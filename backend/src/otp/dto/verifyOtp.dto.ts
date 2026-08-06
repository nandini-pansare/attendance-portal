import { IsEmail, IsInt, IsNotEmpty } from "class-validator";

export class VerifyOtpDto {

    @IsEmail()
    @IsNotEmpty()
    declare email: string;

    @IsInt()
    @IsNotEmpty()
    declare otp: number;
}