import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';

import { PaginationResponse } from '@common/types/api-response.type';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { Model, PipelineStage, Types } from 'mongoose';

import { BaseRepository } from '@common/bases/base.repository';
import { CategoryListingDto } from '../dto/category.dto';

@Injectable()
export class CategoryRepository extends BaseRepository<CategoryDocument> {
    constructor(
        @InjectModel(Category.name) private readonly CategoryModel: Model<CategoryDocument>,
    ) {
        super(CategoryModel);
    }

    async getAllPaginate(
        paginatedDto: CategoryListingDto,
    ): Promise<PaginationResponse<CategoryDocument>> {
        const conditions = {};
        const and_clauses = [];

        const page = paginatedDto.page || 1;
        const limit = paginatedDto.limit || 10;
        const skip = (page - 1) * limit;

        and_clauses.push({ isDeleted: false });

        // Optional search condition
        if (paginatedDto.search) {
            const searchRegex = new RegExp(paginatedDto.search, 'i'); // Case-insensitive search
            and_clauses.push({
                $or: [{ name: searchRegex }]
            });
        }

        if (!paginatedDto.parentId) {
            and_clauses.push({ parentId: { $eq: null } });
        }

        if (paginatedDto.parentId) {
            and_clauses.push({ parentId: { $eq: new Types.ObjectId(paginatedDto.parentId) } });
        }

        // Optional status filter
        if (paginatedDto.status) {
            and_clauses.push({ status: paginatedDto.status });
        }

        // Optional sorting
        const sortField = paginatedDto.sortField || '_id'; // Default to sorting by _id if no field is provided
        const sortOrder = paginatedDto.sortOrder === 'asc' ? 1 : -1; // Default to descending order if not provided

        conditions['$and'] = and_clauses;

        const filterPipeline: PipelineStage[] = [
            { $match: conditions },
            { $skip: skip },
            { $limit: +limit },
            {
                $project: {
                    name: 1,
                    icon: 1,
                    parentId: 1,
                    createdAt: 1,
                    status: 1
                }
            },
            { $sort: { [sortField]: sortOrder } } // Dynamic sorting
        ];

        const countPipeline: PipelineStage[] = [
            { $match: conditions },
            { $count: 'total' }
        ];

        // Perform the aggregation
        const [countResult, aggregate] = await Promise.all([
            this.CategoryModel.aggregate(countPipeline, { allowDiskUse: true })
                .exec()
                .catch((error) => {
                    throw new InternalServerErrorException(
                        `Error during count aggregation: ${error.message}`,
                    );
                }),
            this.CategoryModel.aggregate(filterPipeline, { allowDiskUse: true })
                .exec()
                .catch((error) => {
                    throw new InternalServerErrorException(
                        `Error during data aggregation: ${error.message}`,
                    );
                })
        ]);

        const totalDocs = countResult.length ? countResult[0].total : 0;
        const hasNextPage = totalDocs > 0 && totalDocs - (skip + aggregate.length) > 0;
        const hasPrevPage = page != 1;

        return {
            meta: {
                totalDocs: countResult.length ? countResult[0].total : 0,
                skip: skip,
                page: page,
                limit: limit,
                hasPrevPage,
                hasNextPage,
                prevPage: hasPrevPage ? page - 1 : null,
                nextPage: hasNextPage ? page + 1 : null
            },
            docs: aggregate
        };
    }
}
