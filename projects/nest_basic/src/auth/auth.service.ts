import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiResponse } from '@common/types/api-response.type';
import { RefreshToken } from '@modules/refresh-token/schemas/refresh-token.schema';
import { RoleRepository } from '@modules/role/repositories/role.repository';
import { ForgotPasswordDTO, ResetPasswordDTO, UserSignInDTO, UserSignupDTO } from '@modules/users/dto/user.dto';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { Types } from 'mongoose';
import { RefreshJwtDto } from './dto/auth.dto';
import { RefreshTokenRepository } from '@modules/refresh-token/repository/refresh-token.repository';
import { JwtPayloadType } from '@common/types/jwt.type';
import { MailerService } from '@helpers/mailer.helper';
import { Messages } from '@common/constants/messages';
import { UserDocument } from '@modules/users/schemas/user.schema';
import { UserDevice } from '@modules/user-devices/schemas/user-device.schema';
import { getClientIp } from 'request-ip';
import { lookup } from 'geoip-lite';
import { Request } from 'express';
import { UserDeviceRepository } from '@modules/user-devices/repository/user-device.repository';
import { WinstonLoggerService } from '@common/logger/winston.logger';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { safeAsync } from '@helpers/utils.helper';
import ms from '@helpers/ms.helper';

@Injectable()
export class AuthService {
    winston: WinstonLoggerService;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleRepository: RoleRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
        private readonly userDeviceRepository: UserDeviceRepository,
    ) {
        this.winston = new WinstonLoggerService();
    }

    /**
     * Generate a secure refresh token
     */
    private generateSecureToken(): string {
        return randomBytes(64).toString('hex');
    }

    /**
     * Generate a token family ID for rotation detection
     */
    private generateTokenFamily(): string {
        return randomBytes(32).toString('hex');
    }

    /**
     * Create access and refresh token pair with proper tracking
     */
    async generateTokenPair(
        userId: string | Types.ObjectId,
        deviceId?: string,
        tokenFamily?: string
    ): Promise<{ accessToken: string; refreshToken: string; family: string }> {
        const refreshTokenValue = this.generateSecureToken();
        const family = tokenFamily || this.generateTokenFamily();

        // Calculate expiration times
        const refreshExpiresIn = this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN');
        const accessExpiresIn = this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
        const accessExpiresMs = ms(accessExpiresIn);

        const refreshExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);
        const accessExpiresAt = new Date(Date.now() + accessExpiresMs);

        const refreshToken = new RefreshToken();
        refreshToken.token = refreshTokenValue;
        refreshToken.tokenFamily = family;
        refreshToken.userId = userId;
        refreshToken.expiresAt = refreshExpiresAt;
        refreshToken.accessTokenExpiresAt = accessExpiresAt;
        refreshToken.deviceId = deviceId;
        refreshToken.isRevoked = false;

        const savedRefreshToken = await this.refreshTokenRepository.save(refreshToken);
        const payload: JwtPayloadType = {
            id: userId.toString(),
            tokenId: savedRefreshToken._id.toString()
        };
        const accessToken = this.jwtService.sign(payload);
        this.refreshTokenRepository.updateById({ accessToken }, savedRefreshToken._id);

        return { accessToken, refreshToken: refreshTokenValue, family };
    }

    /**
     * Improved refresh token validation and rotation
     */
    async refreshToken(body: RefreshJwtDto): Promise<ApiResponse> {
        // Find the refresh token
        const refreshTokenData = await this.refreshTokenRepository.findValidToken(body.refreshToken);

        if (!refreshTokenData) {
            throw new UnauthorizedException(Messages.INVALID_TOKEN_ERROR);
        }

        // Verify the user still exists and is active
        const user = await this.userRepository.getByField({
            _id: refreshTokenData.userId,
            isDeleted: false,
            status: 'Active'
        });

        if (!user?._id) {
            await this.refreshTokenRepository.revokeToken(body.refreshToken);
            throw new BadRequestException(Messages.USER_MISSING_ERROR);
        }

        // Token rotation: Issue new tokens and revoke the old one
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.generateTokenPair(
            user._id,
            refreshTokenData.deviceId,
            refreshTokenData.tokenFamily
        );

        await Promise.all([
            this.refreshTokenRepository.revokeToken(body.refreshToken),
            this.refreshTokenRepository.updateLastUsed(newRefreshToken)
        ]);

        return {
            message: Messages.REFRESH_TOKEN_ISSUED_SUCCESS,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        };
    }


    async userSignup(body: UserSignupDTO, files: Express.Multer.File[]): Promise<ApiResponse> {
        const userRole = await this.roleRepository.getByField({ role: 'user' });
        if (!userRole?._id) throw new BadRequestException(Messages.ROLE_NOT_FOUND_ERROR);

        const userExists = await this.userRepository.getByField({ email: body.email, isDeleted: false });
        if (userExists?._id) throw new BadRequestException(Messages.USER_EXIST_ERROR);

        if (files?.length) {
            for (const file of files) {
                body[file.fieldname] = file.filename;
            }
        }

        (body as Partial<UserDocument>).role = userRole._id;
        const saveUser = await this.userRepository.save(body);
        if (!saveUser?._id) throw new BadRequestException(saveUser instanceof Error ? saveUser?.message : Messages.SOMETHING_WENT_WRONG);

        const userDetails = await this.userRepository.getUserDetails({ _id: saveUser._id });
        if (!userDetails) throw new BadRequestException(Messages.USER_MISSING_ERROR);

        const { accessToken: token, refreshToken } = await this.generateTokenPair(userDetails._id);

        return {
            message: Messages.USER_REGISTRATION_SUCCESS,
            data: {
                user: userDetails,
                accessToken: token,
                refreshToken: refreshToken
            }
        };
    }


    async userLogin(body: UserSignInDTO, req: Request): Promise<ApiResponse> {
        const checkIfExists = await this.userRepository.getByField({ email: body.email, isDeleted: false });
        if (!checkIfExists?._id) throw new BadRequestException(Messages.USER_MISSING_ERROR);

        if (!checkIfExists.validPassword(body.password)) {
            throw new BadRequestException(Messages.INVALID_CREDENTIALS_ERROR);
        }

        const userDetails = await this.userRepository.getUserDetails({ _id: checkIfExists._id });
        if (!userDetails) throw new BadRequestException(Messages.USER_MISSING_ERROR);

        let deviceId: string | undefined;

        try {
            const ip = getClientIp(req);
            const geoIpInfo = ip ? lookup(ip) : null;
            if (geoIpInfo) {
                const { ll, region, country, city, timezone } = geoIpInfo;
                const deviceInfo: Partial<UserDevice> = {
                    ip,
                    ip_lat: ll?.[0]?.toString() || '',
                    ip_long: ll?.[1]?.toString() || '',
                    last_active: Date.now(),
                    state: region || '',
                    country: country || '',
                    city: city || '',
                    timezone: timezone || '',
                    user_id: checkIfExists._id
                };
                const savedDevice = await this.userDeviceRepository.saveOrUpdate(deviceInfo, undefined);
                deviceId = savedDevice._id?.toString();
            }
        } catch (err) {
            const st = (err as Error)?.stack?.split('\n')?.reverse()?.slice(0, -2)?.reverse()?.join('\n');
            this.winston.error(st, 'userLoginService');
        }

        const { accessToken, refreshToken } = await this.generateTokenPair(checkIfExists._id, deviceId);
        if (deviceId) {
            const [err, _data] = await safeAsync(this.userDeviceRepository.updateById({ accessToken }, deviceId));
            if (err) {
                const st = (err as Error)?.stack?.split('\n')?.reverse()?.slice(0, -2)?.reverse()?.join('\n');
                this.winston.error(st, 'userLoginService');
            }
        }

        return {
            message: Messages.USER_LOGIN_SUCCESS,
            data: {
                user: userDetails,
                accessToken,
                refreshToken: refreshToken
            }
        };
    }

    async forgotPassword(body: ForgotPasswordDTO): Promise<ApiResponse> {
        const checkIfExists = await this.userRepository.getByField({ email: body.email, isDeleted: false });
        if (!checkIfExists?._id) throw new BadRequestException(Messages.USER_MISSING_ERROR);

        const key = Buffer.from(this.configService.get<string>('CRYPTO_AES_KEY'), 'hex');
        const iv = Buffer.from(this.configService.get<string>('CRYPTO_AES_IV'), 'hex');

        const cipher = createCipheriv(this.configService.get('CRYPTO_ALGORITHM'), key, iv);
        const payload = JSON.stringify({ id: checkIfExists._id, iat: Date.now() + 500 * 1000 });
        const token = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]).toString('hex');

        const sender = `${this.configService.get<string>('PROJECT_NAME')} Admin<${this.configService.get<string>('SITE_EMAIL')}>`;
        const locals = {
            project_name: this.configService.get<string>('PROJECT_NAME'),
            resetLink: `${body.baseUrl}/reset-password/${token}`
        };

        try {
            await this.mailerService.sendMail(
                sender,
                checkIfExists.email,
                'Password Reset Link',
                'forgot-password',
                locals
            );
        } catch (error) {
            throw new BadRequestException(error);
        }

        return { message: Messages.FORGOT_PASSWORD_SUCCESS };
    }

    async resetPassword(body: ResetPasswordDTO): Promise<ApiResponse> {
        let decoded: { id: string, iat: number };

        try {
            const key = Buffer.from(this.configService.get<string>('CRYPTO_AES_KEY'), 'hex');
            const iv = Buffer.from(this.configService.get<string>('CRYPTO_AES_IV'), 'hex');

            const decipher = createDecipheriv(this.configService.get('CRYPTO_ALGORITHM'), key, iv);
            const decryptedData = Buffer.concat([decipher.update(Buffer.from(body.authToken, 'hex')), decipher.final()]);
            decoded = JSON.parse(decryptedData.toString('utf-8'));

            if (decoded.iat <= (Date.now())) throw new BadRequestException(Messages.INVALID_TOKEN_ERROR);
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : Messages.INVALID_TOKEN_ERROR);
        }

        const checkIfExists = await this.userRepository.getByField({ _id: Types.ObjectId.createFromHexString(decoded.id), isDeleted: false });
        if (!checkIfExists?._id) throw new BadRequestException(Messages.USER_MISSING_ERROR);

        const updatePassword = await this.userRepository.updateById({ password: body.newPassword }, checkIfExists._id);
        if (!updatePassword) throw new BadRequestException(Messages.SOMETHING_WENT_WRONG);
        return { message: Messages.PASSWORD_UPDATE_SUCCESS };
    }

    /**
     * Logout user by revoking refresh token and invalidating access token
     */
    async logout(refreshToken: string): Promise<ApiResponse> {
        const tokenData = await this.refreshTokenRepository.findValidToken(refreshToken);
        if (tokenData) await this.refreshTokenRepository.revokeToken(refreshToken);

        return { message: 'Logout successful' };
    }

    /**
     * Logout from all devices by revoking all user's refresh tokens
     */
    async logoutFromAllDevices(userId: string): Promise<ApiResponse> {
        await this.refreshTokenRepository.revokeAllUserTokens(userId);
        return { message: 'Logged out from all devices successfully' };
    }

    /**
     * Get user's active sessions
     */
    async getUserActiveSessions(userId: string): Promise<ApiResponse> {
        const sessions = await this.refreshTokenRepository.getUserActiveTokens(userId);
        return {
            message: 'Active sessions retrieved successfully',
            data: sessions.map(session => ({
                deviceId: session.deviceId,
                createdAt: session.createdAt,
                lastUsedAt: session.lastUsedAt,
                expiresAt: session.expiresAt,
                accessTokenExpiresAt: session.accessTokenExpiresAt
            }))
        };
    }

    /**
     * Scheduled cleanup of expired tokens (call this periodically)
     */
    async cleanupExpiredTokens(): Promise<void> {
        await this.refreshTokenRepository.cleanupExpiredTokens();
    }

}