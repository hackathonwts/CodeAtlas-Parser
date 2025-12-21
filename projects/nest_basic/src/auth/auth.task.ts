import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WinstonLoggerService } from '@common/logger/winston.logger';

@Injectable()
export class AuthTaskService {
    private readonly winston: WinstonLoggerService;

    constructor(private readonly authService: AuthService) {
        this.winston = new WinstonLoggerService();
    }

    /**
     * Cleanup expired refresh tokens
     * This should be called periodically (e.g., via a cron job or scheduler)
     */
    async cleanupExpiredTokens() {
        try {
            await this.authService.cleanupExpiredTokens();
            console.log('Expired refresh tokens cleaned up successfully');
        } catch (error) {
            this.winston.error('Failed to cleanup expired tokens: ' + error.message, 'AuthTaskService');
        }
    }
}
