import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../interfaces/auth.interface';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);
