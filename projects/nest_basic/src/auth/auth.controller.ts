import { Body, Controller, HttpCode, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshJwtDto, LogoutDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ForgotPasswordDTO, ResetPasswordDTO, UserSignInDTO, UserSignupDTO } from '@modules/users/dto/user.dto';
import { SingleFileInterceptor } from '@common/interceptors/files.interceptor';
import { Request } from 'express';
import { LoginUser } from '@common/decorator/login-user.decorator';
import { ApiGroup } from '@common/decorator/api-group.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }


    @Post('login')
    @HttpCode(200)
    @UseGuards(ThrottlerGuard)
    async login(@Body() dto: UserSignInDTO, @Req() req: Request) {
        return this.authService.userLogin(dto, req);
    }

    @Post('register')
    @UseGuards(ThrottlerGuard)
    @UseInterceptors(SingleFileInterceptor('users', 'profileImage'))
    @ApiConsumes('application/json', 'multipart/form-data')
    async signup(@Body() dto: UserSignupDTO, @UploadedFiles() files: Express.Multer.File[]) {
        return this.authService.userSignup(dto, files);
    }

    @Post('forgot-password')
    @HttpCode(200)
    @UseGuards(ThrottlerGuard)
    async forgotPassword(@Body() dto: ForgotPasswordDTO) {
        return this.authService.forgotPassword(dto);
    }


    @Post('reset-password')
    @HttpCode(200)
    @UseGuards(ThrottlerGuard)
    async resetPassword(@Body() dto: ResetPasswordDTO) {
        return this.authService.resetPassword(dto);
    }


    @Post('refresh-token')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async refreshToken(@Body() dto: RefreshJwtDto) {
        return this.authService.refreshToken(dto);
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async logout(@Body() dto: LogoutDto) {
        return this.authService.logout(dto.refreshToken);
    }

    @Post('logout-all')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async logoutFromAllDevices(@LoginUser('id') userId: string) {
        return this.authService.logoutFromAllDevices(userId);
    }

}