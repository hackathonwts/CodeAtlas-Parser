import { Module } from '@nestjs/common';
import { KafkaController } from './kafka.controller';
import { ParserModule } from '../parser/parser.module';

@Module({
    imports: [ParserModule],
    controllers: [KafkaController],
})
export class KafkaModule { }
