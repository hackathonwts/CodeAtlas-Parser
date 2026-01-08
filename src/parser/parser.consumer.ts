import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ParserEvent } from './parser.events';

@Controller()
export class ParserConsumer {
    @EventPattern('parser.parse')
    async handleParsingEvent(@Payload() message: { type: ParserEvent; payload: any }) {
        console.log(
            '[KAFKA EVENT]',
            message.type,
            message.payload,
        );
    }
}
