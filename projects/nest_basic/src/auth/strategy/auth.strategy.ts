import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { Request } from 'express';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { RefreshTokenRepository } from '@modules/refresh-token/repository/refresh-token.repository';
import { JwtPayloadType } from '@common/types/jwt.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            passReqToCallback: true
        });
    }

    async validate(_req: Request, payload: JwtPayloadType, done: VerifiedCallback) {
        const { id, tokenId } = payload;

        // Check if access token is still valid (not revoked)
        if (tokenId && !(await this.refreshTokenRepository.isAccessTokenValid(tokenId))) {
            return done(new UnauthorizedException('Token has been revoked'), false);
        }

        const user = await this.userRepository.getUserDetailsJwtAuth(id);
        if (!user) return done(new UnauthorizedException(), false);

        return done(null, user, payload.iat);
    }
}
