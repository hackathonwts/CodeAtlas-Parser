import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../schemas/category.schema';
import { CategoryRepository } from './category.repository';

@Global()
@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: Category.name,
                useFactory: () => {
                    const schema = CategorySchema;
                    return schema;
                }
            }
        ])
    ],
    controllers: [],
    providers: [CategoryRepository],
    exports: [CategoryRepository]
})
export class CategoryRepositoryModule {}
