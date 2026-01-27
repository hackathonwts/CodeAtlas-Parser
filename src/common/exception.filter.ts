import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ADMIN_AUTH_TOKEN_NAME } from './constants';
import { MongooseError } from 'mongoose';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    private configService: ConfigService;
    constructor() {
        this.configService = new ConfigService();
    }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception?.name === 'MongooseError') {
            return response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: 400,
                message: (exception as MongooseError).message || 'Validation failed',
                stack: this.configService.get('NODE_ENV') === 'development' ? exception.stack : undefined,
            });
        }

        const isHttpException = exception instanceof HttpException;
        const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        let message = 'Internal server error';

        if (isHttpException) {
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
                const messages = Array.isArray((exceptionResponse as any).message) ? (exceptionResponse as any).message : [(exceptionResponse as any).message];
                message = messages[0];
            } else if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else {
                message = exception.message;
            }

            switch (status) {
                case HttpStatus.UNAUTHORIZED:
                    message = 'Unauthorized';
                    response.clearCookie(ADMIN_AUTH_TOKEN_NAME);
                    break;
                case HttpStatus.TOO_MANY_REQUESTS:
                    message = 'Too Many Requests';
                    break;
                case HttpStatus.FORBIDDEN:
                    message = 'You do not have permission to access this resource';
                    break;
            }
        } else {
            console.error('Unhandled exception:', exception);
            message = exception.message || 'Internal server error';
        }

        const data = {
            statusCode: status,
            message,
            stack: this.configService.get('NODE_ENV') === 'development' ? exception.stack : undefined,
        };

        return response.status(status).json(data);
    }
}
