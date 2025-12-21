import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cms, CmsSchema } from '../schemas/cms.schema';
import { CmsRepository } from './cms.repository';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Cms.name, schema: CmsSchema }])
    ],
    controllers: [],
    providers: [CmsRepository],
    exports: [CmsRepository]
})
export class CmsRepositoryModule {}
