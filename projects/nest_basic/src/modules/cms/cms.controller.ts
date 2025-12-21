import { Body, Controller, Post, UseGuards, Get, Param, Version, HttpCode, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { AuthGuard } from '@nestjs/passport';
import { CmsListingDto, StatusCmsDto, UpdateCmsDto } from '@modules/cms/dto/cms.dto';
import { MongoIdPipe } from '@common/pipes/mongoid.pipe';


@ApiTags('CMS')
@Controller('admin/cms')
export class CmsController {
    constructor(
        private readonly cmsService: CmsService
    ) { }

    @Version('1')
    @Post('getall')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async getAllCms(@Body() dto: CmsListingDto) {
        return this.cmsService.getAll(dto);
    }

    @Version('1')
    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async getCms(@Param('id', new MongoIdPipe()) id: string) {
        return this.cmsService.get(id);
    }

    @Version('1')
    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async updateCms(@Param('id', new MongoIdPipe()) id: string, @Body() dto: UpdateCmsDto) {
        return this.cmsService.update(id, dto);
    }

    @Version('1')
    @Patch('status-change/:id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async statusChange(@Param('id', new MongoIdPipe()) id: string, @Body() dto: StatusCmsDto) {
        return this.cmsService.statusUpdate(id, dto);
    }

}
