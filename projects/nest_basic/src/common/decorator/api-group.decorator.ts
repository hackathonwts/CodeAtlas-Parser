import { SetMetadata } from '@nestjs/common';

export const CUSTOM_SWAGGER_META = 'custom:swagger-meta';
export const ApiGroup = (meta: string) => SetMetadata(CUSTOM_SWAGGER_META, meta);