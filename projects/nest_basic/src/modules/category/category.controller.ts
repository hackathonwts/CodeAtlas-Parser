import {
    Body,
    Controller,
    Post,
    UseGuards,
    Get,
    Param,
    Patch,
    Delete,
    Version,
    HttpCode
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { AuthGuard } from '@nestjs/passport';
import {
    CategoryListingDto,
    SaveCategoryDto,
    StatusCategoryDto,
    UpdateCategoryDto
} from '@modules/category/dto/category.dto';
import { MongoIdPipe } from '@common/pipes/mongoid.pipe';


@ApiTags('Category')
@Controller('admin/category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Version('1')
    @Post('getall')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async getAll(@Body() dto: CategoryListingDto) {
        return this.categoryService.getAll(dto);
    }

    @Version('1')
    @Post()
    @ApiConsumes('multipart/form-data')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async save(@Body() dto: SaveCategoryDto) {
        return this.categoryService.save(dto);
    }

    @Version('1')
    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async get(@Param('id', new MongoIdPipe()) id: string) {
        return this.categoryService.get(id);
    }

    @Version('1')
    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async update(@Param('id', new MongoIdPipe()) id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoryService.update(id, dto);
    }

    @Version('1')
    @Patch('status-change/:id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async statusChange(@Param('id', new MongoIdPipe()) id: string, @Body() dto: StatusCategoryDto) {
        return this.categoryService.statusUpdate(id, dto);
    }

    @Version('1')
    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async delete(@Param('id', new MongoIdPipe()) id: string) {
        return this.categoryService.delete(id);
    }
}
