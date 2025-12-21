import { Body, Controller, Post, UseGuards, Version, UseInterceptors, UploadedFiles, Param, Get, Delete, HttpCode, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto, ListingUserDto, SaveUserDTO, StatusUserDto, UpdateUserDto } from '@modules/users/dto/user.dto';
import { SingleFileInterceptor } from '@common/interceptors/files.interceptor';
import { UserDocument } from './schemas/user.schema';
import { LoginUser } from '@common/decorator/login-user.decorator';
import { MongoIdPipe } from '@common/pipes/mongoid.pipe';
import { UserService } from './user.service';
import { Roles } from '@common/decorator/role.decorator';
import { UserRole } from '@common/enum/user-role.enum';
import { RBAcGuard } from '@common/guards/rbac.guard';
import { ApiGroup } from '@common/decorator/api-group.decorator';


@ApiGroup('Admin')
@ApiTags('User')
@Controller('admin/user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Version('1')
    @Post('getall')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    async getAllUsers(@Body() dto: ListingUserDto) {
        return this.userService.getAllUsers(dto);
    }

    @Version('1')
    @Get('profile-details')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    async profileDetails(@LoginUser() user: Partial<UserDocument>) {
        return this.userService.profileDetails(user);
    }

    @Version('1')
    @Post()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(SingleFileInterceptor('users', 'profileImage'))
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    async saveUser(@Body() dto: SaveUserDTO, @UploadedFiles() files: Express.Multer.File[]) {
        return this.userService.saveUser(dto, files);
    }

    @Version('1')
    @Get(':id')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    async getUser(@Param('id', new MongoIdPipe()) id: string) {
        return this.userService.getUser(id);
    }

    @Version('1')
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(SingleFileInterceptor('users', 'profileImage'))
    async updateUser(@Param('id', new MongoIdPipe()) id: string, @Body() dto: UpdateUserDto, @UploadedFiles() files: Express.Multer.File[]) {
        return this.userService.updateUser(id, dto, files);
    }

    @Version('1')
    @Patch('status-change/:id')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    async updateStatus(@Param('id', new MongoIdPipe()) id: string, @Body() dto: StatusUserDto) {
        return this.userService.updateUserStatus(id, dto);
    }

    @Version('1')
    @Patch('change-password/:id')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    async changePassword(@Param('id', new MongoIdPipe()) id: string, @Body() dto: ChangePasswordDto) {
        return this.userService.changePassword(id, dto);
    }

    @Version('1')
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @UseGuards(AuthGuard('jwt'), RBAcGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    async delete(@Param('id', new MongoIdPipe()) id: string) {
        return this.userService.deleteUser(id);
    }

}
