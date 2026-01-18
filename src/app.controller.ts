import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getRoot(): { message: string; service: string } {
        return {
            message: 'CodeAtlas Parser Microservice',
            service: 'running',
        };
    }
}
