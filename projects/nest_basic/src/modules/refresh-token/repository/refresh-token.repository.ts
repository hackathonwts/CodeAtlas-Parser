import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/bases/base.repository';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshTokenDocument> {
    constructor(
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    ) {
        super(refreshTokenModel);
    }

    async findValidToken(token: string): Promise<RefreshTokenDocument | null> {
        return await this.refreshTokenModel.findOne({
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).populate('userId');
    }

    async findByTokenId(tokenId: string | Types.ObjectId): Promise<RefreshTokenDocument | null> {
        return await this.refreshTokenModel.findOne({
            _id: tokenId,
            isRevoked: false,
            accessTokenExpiresAt: { $gt: new Date() }
        });
    }

    async isAccessTokenValid(tokenId: string | Types.ObjectId): Promise<boolean> {
        const tokenRecord = await this.refreshTokenModel.findOne({
            _id: tokenId,
            isRevoked: false,
            accessTokenExpiresAt: { $gt: new Date() }
        });
        return !!tokenRecord;
    }

    async revokeByTokenId(tokenId: string | Types.ObjectId): Promise<void> {
        await this.refreshTokenModel.updateOne(
            { _id: tokenId },
            { isRevoked: true, updatedAt: new Date() }
        );
    }

    async revokeToken(token: string): Promise<void> {
        await this.refreshTokenModel.updateOne(
            { token },
            { isRevoked: true, updatedAt: new Date() }
        );
    }

    async revokeAllUserTokens(userId: string | Types.ObjectId): Promise<void> {
        await this.refreshTokenModel.updateMany(
            { userId, isRevoked: false },
            { isRevoked: true, updatedAt: new Date() }
        );
    }

    async revokeTokenFamily(tokenFamily: string): Promise<void> {
        await this.refreshTokenModel.updateMany(
            { tokenFamily, isRevoked: false },
            { isRevoked: true, updatedAt: new Date() }
        );
    }

    async cleanupExpiredTokens(): Promise<void> {
        await this.refreshTokenModel.deleteMany({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { accessTokenExpiresAt: { $lt: new Date() } },
                { isRevoked: true, updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old revoked tokens
            ]
        });
    }

    async getUserActiveTokens(userId: string | Types.ObjectId): Promise<RefreshTokenDocument[]> {
        return await this.refreshTokenModel.find({
            userId,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
    }

    async updateLastUsed(token: string): Promise<void> {
        await this.refreshTokenModel.updateOne(
            { token },
            { lastUsedAt: new Date(), updatedAt: new Date() }
        );
    }
}