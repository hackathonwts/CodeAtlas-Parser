import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { IPolicy } from 'src/policy/policy.interface';
import { IUser } from 'src/user/schemas/user.schema';

export const LoggedInUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user as LoggedInUser;
});

export type LoggedInUser = Partial<IUser> & {
    _id: string;
    active_role?: { role: string; policy: IPolicy[] };
    policy?: { allow: IPolicy[]; deny: IPolicy[] };
};
