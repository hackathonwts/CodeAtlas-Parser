import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import mongoose, { Types } from 'mongoose';
import { ApiResponse } from '@common/types/api-response.type';
import { FaqListingDto, SaveFaqDto, StatusFaqDto, UpdateFaqDto } from '@modules/faq/dto/faq.dto';
import { FaqRepository } from '@modules/faq/repositories/faq.repository';
import { Messages } from '@common/constants/messages';


@Injectable()
export class FaqService {
    constructor(
        private readonly faqRepository: FaqRepository,
    ) { }


    async getAll(body: FaqListingDto): Promise<ApiResponse> {
        const getAllFaqs = await this.faqRepository.getAllPaginate(body);
        return { message: 'FAQ data fetched successfully.', data: getAllFaqs };
    }


    async save(body: SaveFaqDto): Promise<ApiResponse> {
        const existingFaq = await this.faqRepository.getByField({ question: body.question, isDeleted: false });
        if (existingFaq) throw new BadRequestException('FAQ question already exists!');

        const saveFaq = await this.faqRepository.save(body);
        if (!saveFaq) {
            throw new BadRequestException(saveFaq instanceof Error ? saveFaq.message : 'Something went wrong!');
        }

        return { message: 'FAQ saved successfully.', data: saveFaq };
    }


    async get(id: string): Promise<ApiResponse> {
        const faq = await this.faqRepository.getByField({ _id: new mongoose.Types.ObjectId(id), isDeleted: false });
        if (!faq) throw new NotFoundException('FAQ not found!');

        return { message: 'FAQ retrieved successfully.', data: faq };
    }


    async update(id: string, body: UpdateFaqDto): Promise<ApiResponse> {
        const existingFaq = await this.faqRepository.getByField({ question: body.question, isDeleted: false, _id: { $ne: new Types.ObjectId(id) } });

        if (existingFaq) throw new BadRequestException('FAQ question already exists!');

        const updatedValue = {
            question: body.question,
            answer: body.answer
        };

        const update = await this.faqRepository.updateById(updatedValue, new Types.ObjectId(id));
        if (!update) throw new BadRequestException(update instanceof Error ? update : Messages.SOMETHING_WENT_WRONG);

        return { message: 'FAQ updated successfully.', data: update };
    }


    async delete(id: string): Promise<ApiResponse> {
        const delData = await this.faqRepository.updateById({ isDeleted: true }, id);
        if (!delData) throw new BadRequestException(delData instanceof Error ? delData : Messages.SOMETHING_WENT_WRONG);
        return { message: 'FAQ deleted successfully.' };
    }

    async statusUpdate(id: string, body: StatusFaqDto): Promise<ApiResponse> {
        const update = await this.faqRepository.updateById(body, new Types.ObjectId(id));
        if (!update) throw new BadRequestException(update instanceof Error ? update : Messages.SOMETHING_WENT_WRONG);
        return { message: 'FAQ Status updated successfully.', data: update };
    }

}
