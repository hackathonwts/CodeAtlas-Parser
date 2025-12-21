import { Body, Controller, Post, UseGuards, Get, Param, Delete, Version, HttpCode, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { AuthGuard } from '@nestjs/passport';
import {  FaqListingDto, SaveFaqDto, StatusFaqDto, UpdateFaqDto } from '@modules/faq/dto/faq.dto';
import { MongoIdPipe } from '@common/pipes/mongoid.pipe';

@ApiTags('FAQ')
@Controller('admin/faq')
export class FaqController {
    constructor(
        private readonly faqService: FaqService
    ) { }

    @Version('1')
    @Post('getall')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async getAllFaq(@Body() dto: FaqListingDto) {
        return this.faqService.getAll(dto);
    }

    @Version('1')
    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async saveFaq(@Body() dto: SaveFaqDto) {
        return this.faqService.save(dto);
    }

    @Version('1')
    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async getFaq(@Param('id', new MongoIdPipe()) id: string) {
        return this.faqService.get(id);
    }

    @Version('1')
    @Patch('/:id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async updateFaq(@Param('id', new MongoIdPipe()) id: string, @Body() dto: UpdateFaqDto) {
        return this.faqService.update(id, dto);
    }

    @Version('1')
    @Patch('status-change/:id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async statusChange(@Param('id', new MongoIdPipe()) id: string, @Body() dto: StatusFaqDto) {
        return this.faqService.statusUpdate(id, dto);
    }

    @Version('1')
    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async deleteFaq(@Param('id', new MongoIdPipe()) id: string) {
        return this.faqService.delete(id);
    }

}
