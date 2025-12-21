import { Module } from '@nestjs/common';
import { AuthModule } from '@auth/auth.module';
import { HelpersModule } from '@helpers/helpers.module';
import { FaqModule } from '@modules/faq/faq.module';
import { FaqRepositoryModule } from '@modules/faq/repositories/faq.repository.module';
import { RefreshTokenModule } from '@modules/refresh-token/refresh-token.module';
import { RoleModule } from '@modules/role/role.module';
import { UserDeviceRepositoryModule } from '@modules/user-devices/repository/user-device-repository.module';
import { UserRepositoryModule } from '@modules/users/repositories/user-repository.module';
import { UsersModule } from '@modules/users/users.module';
import { CategoryRepositoryModule } from '@modules/category/repositories/category.repository.module';
import { CategoryModule } from '@modules/category/category.module';
import { CmsModule } from '@modules/cms/cms.module';
import { CmsRepositoryModule } from '@modules/cms/repositories/cms.repository.module';
import { RoleRepositoryModule } from '@modules/role/repositories/role.repository.module';
import { ApiConfigModule } from './config.module';
import { DiscoveryModule } from '@nestjs/core';



@Module({
    imports: [
        ApiConfigModule,
        HelpersModule,
        AuthModule,
        FaqModule,
        FaqRepositoryModule,
        RefreshTokenModule,
        RoleModule,
        UserDeviceRepositoryModule,
        UserRepositoryModule,
        UsersModule,
        CategoryRepositoryModule,
        CategoryModule,
        CmsModule,
        CmsRepositoryModule,
        RoleRepositoryModule,
        DiscoveryModule,
    ],
    providers: []
})
export class AppModule { }