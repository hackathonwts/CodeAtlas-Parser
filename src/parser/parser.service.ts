import { Injectable } from '@nestjs/common';
import { CreateParserDto } from './dto/parser.dto';

@Injectable()
export class ParserService {
    async handleCreateParser(message: CreateParserDto) {
        console.log('Received create_parser message:', message);
    }
}
