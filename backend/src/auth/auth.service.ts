import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.model';
import { SessionModel } from './session.model';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User)
        private readonly userModel: typeof User, 
        private readonly jwtService: JwtService,
    ){}

    async login(username: string, password: string, req: Express.Request){
        const user = await this.userModel.findOne({ where: {username}});
        if(!user){
            throw new BadRequestException('Invalid Credentials! User or Password is invalid');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            throw new BadRequestException('Invalid Credentials!');
        }
        const session = req.session;
        session.userId = user.userId;
        session.role = user.role;
        session.email = user.email;

        const token = this.jwtService.sign({
            userId: user.userId,
            role: user.role,
            email: user.email,
        });

        return {
            message: 'Login Successful.',
            user: {
                userId: user.userId,
                username: user.username,
            },
            sessionID: req.sessionID,
            token,
        };
    }

    async logout(req: Express.Request): Promise<{message: string}>{
        const destroy = promisify(req.session.destroy).bind(req.session);
        try{
            await destroy();
            return{ message: 'Logout Successful!'};
        } catch (err){
            throw new BadRequestException('Logout Failed');
        }
    }
}