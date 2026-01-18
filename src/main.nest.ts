import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    // Create NestJS application
    const app = await NestFactory.create(AppModule);

    // Get config service
    const configService = app.get(ConfigService);

    // Enable validation globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Connect Kafka microservice
    const kafkaBrokers = configService.get<string[]>('kafka.brokers');
    const kafkaGroupId = configService.get<string>('kafka.groupId');
    const kafkaClientId = configService.get<string>('kafka.clientId');

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: kafkaClientId,
                brokers: kafkaBrokers,
            },
            consumer: {
                groupId: kafkaGroupId,
            },
        },
    });

    // Start all microservices
    await app.startAllMicroservices();
    console.log('✅ Kafka microservice started');
    console.log(`📡 Brokers: ${kafkaBrokers.join(', ')}`);
    console.log(`👥 Consumer Group: ${kafkaGroupId}`);

    // Start HTTP server for health checks
    const port = configService.get<number>('port');
    await app.listen(port);

    console.log(`✅ HTTP server listening on port ${port}`);
    console.log(`🏥 Health check available at http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
    console.error('❌ Error starting application:', error);
    process.exit(1);
});
