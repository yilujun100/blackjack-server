import { HttpException, Injectable, NestMiddleware} from '@nestjs/common';
import { Request, Response, NextFunction} from 'express';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly userService: UserService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const [authType, authData = ''] = (req.header('authorization') || '').split(' ');
        if (authType === 'tma') {
            try {
                this.userService.validateInitData(authData);
                res.locals.user = await this.userService.findOne(authData);
                if (req.url === '/user' && req.method === 'GET') {
                    return res.json(res.locals.user);
                }
                return next();
            } catch (e) {
                return next(new HttpException('Unauthorized', 401));
            }
        } else {
            return next(new HttpException('Unauthorized', 401));
        }
    }
}