import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { ParserProducer } from './parser.producer';
import { ParserConsumer } from './parser.consumer';

@Module({
    controllers: [
        ParserProducer,
        ParserConsumer
    ],
    providers: [
        ParserService,
        KafkaProducerService
    ],
})
export class ParserModule { }
