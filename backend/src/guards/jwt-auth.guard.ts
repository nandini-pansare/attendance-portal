import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor (private readonly jwtService: JwtService){}
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];

        if(!authHeader || !authHeader.startsWith ('Bearer')){
            throw new UnauthorizedException('Invalid or missing Authorization Header');
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const payload = this.jwtService.verify(token);
            req.user = payload;
            if (req.session) {
                try {
                    req.session.userId = payload.userId;
                    req.session.role = payload.role;
                    req.session.email = payload.email;
                } catch (_e) {
                    // ignore session write errors
                }
            }

            return true;
        } catch (err: any) {
            console.log(err.message);
            throw new UnauthorizedException(err.message);
        }
    }
}