import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from '../schemas/faq.schema';
import { FaqRepository } from './faq.repository';

@Global()
@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: Faq.name,
                useFactory: () => {
                    const schema = FaqSchema;
                    return schema;
                }
            }
        ])
    ],
    controllers: [],
    providers: [FaqRepository],
    exports: [FaqRepository]
})
export class FaqRepositoryModule {}
