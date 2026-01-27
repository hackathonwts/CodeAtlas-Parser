import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from 'src/role/schemas/role.schema';

export const Roles = (...roles: UserRoleEnum[]): CustomDecorator<string> => {
    return SetMetadata('roles', roles);
};
