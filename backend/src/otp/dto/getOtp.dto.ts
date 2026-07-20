import { IsEmail, IsNotEmpty } from "class-validator";

export class GetOtpDto {

    @IsEmail()
    @IsNotEmpty()
    declare email: string;
}