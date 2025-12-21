import {  HttpStatus, ValidationPipe } from '@nestjs/common';

export class ApiValidationPipe extends ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            errorHttpStatusCode: HttpStatus.BAD_REQUEST
        });
    }
}