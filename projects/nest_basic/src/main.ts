import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { resolve } from 'path';

import { AppModule } from './app.module';
import { ApiValidationPipe } from './common/pipes/validation.pipe';
import { CustomExceptionFilter } from './common/filters/exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { execSync } from 'child_process';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchSwaggerDoc } from '@common/patches/swagger.patch';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get<ConfigService>(ConfigService);
    const logger = app.get<Logger>(Logger);

    app.enableCors({
        origin: '*',
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        credentials: true
    });
    app.use(compression());
    app.use(helmet({
        crossOriginResourcePolicy: false
    }));

    app.setGlobalPrefix('/api');
    app.enableVersioning();
    app.useGlobalPipes(new ApiValidationPipe());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new CustomExceptionFilter());

    app.useStaticAssets(resolve('./public'));
    app.setBaseViewsDir(resolve('./views'));

    let groups: Map<string, any> = new Map();
    const enableSwaggerDoc = configService.getOrThrow('NODE_ENV') === 'development';
    const enableSwaggerPatch = true;
    if (enableSwaggerDoc) {
        const config = new DocumentBuilder()
            .setOpenAPIVersion('3.1.0')
            .addBearerAuth()
            .setTitle('WTS NestJS Setup - API Documentation')
            .setDescription('API endpoints')
            .setVersion('1.0')
            .build();

        const doc = SwaggerModule.createDocument(app, config);
        let { sggrGroups, defaultDoc } = patchSwaggerDoc(app, doc, enableSwaggerPatch);
        SwaggerModule.setup('apidoc', app, defaultDoc);
        sggrGroups.forEach((groupDoc, groupName) => {
            const endpoint = `apidoc/${groupName.toLowerCase()}`;
            SwaggerModule.setup(endpoint, app, groupDoc);
        });
        groups = sggrGroups;
    }

    await app.listen(configService.getOrThrow('PORT'), () => {
        const isPrimaryInstance = (process.env.NODE_APP_INSTANCE == '0' || process.env.NODE_APP_INSTANCE === undefined);
        if (isPrimaryInstance) {
            logger.debug(`[BOOT] Base URL          : http://127.0.0.1:${configService.get('PORT')}`);
            logger.debug(`[BOOT] Node Version      : ${process.version}`);
            logger.debug(`[BOOT] Env (NODE_ENV)    : ${configService.get('NODE_ENV') || 'development'}`);
            try {
                const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
                logger.debug(`[BOOT] Git Branch        : ${gitBranch}`);
            } catch (error) {
                logger.debug(`[BOOT] Git Branch        : n/a`);
            }

            if (enableSwaggerDoc) {
                logger.debug(`[BOOT] Swagger Doc       : http://127.0.0.1:${configService.get('PORT')}/apidoc`);
                groups.forEach((_gD: string, _gN: string) => {
                    const endpoint = `apidoc/${_gN.toLowerCase()}`;
                    logger.debug(`[BOOT] Swagger Doc ${_gN.padEnd(6)}: http://127.0.0.1:${configService.get('PORT')}/${endpoint}`);
                });
            }
        }
        logger.debug(`[BOOT] PM2 Instance      : ${process.env.NODE_APP_INSTANCE !== undefined ? process.env.NODE_APP_INSTANCE : 'n/a'}`);
    });
}

bootstrap().catch(console.error);