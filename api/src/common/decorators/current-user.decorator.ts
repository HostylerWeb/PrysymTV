import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserPayload } from '../types/auth-user.payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUserPayload }>();
    return request.user;
  },
);
