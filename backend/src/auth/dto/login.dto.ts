import { IsString } from 'class-validator';

export class loginDto {

    @IsString()
    declare username: string;

    @IsString()
    declare password: string;
}