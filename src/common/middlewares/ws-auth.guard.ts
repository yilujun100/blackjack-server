import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { User } from 'src/types/user.types';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) throw new UnauthorizedException();
    const [authType, authData = ''] = authHeader.split(' ');
    if (authType !== 'tma') throw new UnauthorizedException();
    try {
      const user = await this.validateUser(authData);
      client.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  private async validateUser(authData: string): Promise<User> {
    try {
      this.userService.validateInitData(authData);
      const user = await this.userService.findOne(authData);
      if (!user) throw new UnauthorizedException();
      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
