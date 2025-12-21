import { BadRequestException, Injectable } from '@nestjs/common';
import mongoose, { Types } from 'mongoose';
import { ApiResponse } from '@common/types/api-response.type';
import { CmsListingDto, StatusCmsDto, UpdateCmsDto } from '@modules/cms/dto/cms.dto';
import { CmsRepository } from '@modules/cms/repositories/cms.repository';
import { Messages } from '@common/constants/messages';


@Injectable()
export class CmsService {
    constructor(
        private readonly cmsRepository: CmsRepository
    ) { }


    async getAll(body: CmsListingDto): Promise<ApiResponse> {
        const getAllCmss = await this.cmsRepository.getAllPaginate(body);
        return { message: 'CMS data fetched successfully.', data: getAllCmss };
    }


    async get(id: string): Promise<ApiResponse> {
        const cms = await this.cmsRepository.getByField({ _id: new mongoose.Types.ObjectId(id), isDeleted: false });
        if (!cms) throw new BadRequestException('CMS not found!');
        return { message: 'CMS retrieved successfully.', data: cms };
    }


    async update(id: string, body: UpdateCmsDto): Promise<ApiResponse> {
        const existingCms = await this.cmsRepository.getByField({ title: body.title, isDeleted: false, _id: { $ne: new Types.ObjectId(id) } });
        if (existingCms) throw new BadRequestException('CMS title already exists');

        const update = await this.cmsRepository.updateById(body, new Types.ObjectId(id));
        if (!update) throw new BadRequestException(update instanceof Error ? update : Messages.SOMETHING_WENT_WRONG);
        return { message: 'CMS updated successfully.', data: update };
    }


    async statusUpdate(id: string, body: StatusCmsDto): Promise<ApiResponse> {
        const update = await this.cmsRepository.updateById(body, new Types.ObjectId(id));
        if (!update) throw new BadRequestException(update instanceof Error ? update : Messages.SOMETHING_WENT_WRONG);
        return { message: 'Status updated successfully.', data: update };
    }

}
