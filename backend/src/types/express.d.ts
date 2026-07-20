import 'express';

declare global{
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: string;
                email?: string;
            };
        }
    }
}
export {};