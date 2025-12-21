import { Controller, UseGuards, Version, HttpCode, Body, UploadedFiles, UseInterceptors, Get, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { LoginUser } from '@common/decorator/login-user.decorator';
import { UserDocument } from './schemas/user.schema';
import { SingleFileInterceptor } from '@common/interceptors/files.interceptor';
import { UpdateFrontendUserDto } from './dto/user.dto';
import { MongoIdPipe } from '@common/pipes/mongoid.pipe';


@ApiTags('User')
@Controller('user')
export class UserApiController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Version('1')
    @Get('profile-details')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(200)
    async profileDetails(@LoginUser() user: Partial<UserDocument>) {
        return this.userService.profileDetails(user);
    }

    @Version('1')
    @Patch('/:id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(SingleFileInterceptor('users', 'profileImage'))
    async updateFrontendUser(@Param('id', new MongoIdPipe()) id: string, @Body() dto: UpdateFrontendUserDto, @UploadedFiles() files: Express.Multer.File[]) {
        return this.userService.updateFrontendUser(id, dto, files);
    }

}
