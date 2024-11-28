import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const type = ctx.getType();

    if (type === 'http') {
      const request = ctx.switchToHttp().getRequest();
      return request.res.locals.user;
    }

    if (type === 'ws') {
      const client = ctx.switchToWs().getClient();
      return client.user;
    }

    return null;
  },
);
