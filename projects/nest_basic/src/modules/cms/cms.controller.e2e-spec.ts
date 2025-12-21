// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CloseInMongodConnection, RootMongooseTestModule } from '@common/unit-test-config/mongoose-test-module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HydratedDocument, Model, Types } from 'mongoose';
import { UserRepositoryModule } from '@modules/users/repositories/user-repository.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@modules/users/schemas/user.schema';
import { Role, RoleDocument } from '@modules/role/schemas/role.schema';
import { ThrottlerModule } from '@nestjs/throttler';
import { RefreshTokenModule } from '@modules/refresh-token/refresh-token.module';
import { RoleRepositoryModule } from '@modules/role/repositories/role.repository.module';
import { UserDeviceRepositoryModule } from '@modules/user-devices/repository/user-device-repository.module';
import { HelpersModule } from '@helpers/helpers.module';
import { AuthService } from '@auth/auth.service';
import { AuthModule } from '@auth/auth.module';
import { CmsModule } from './cms.module';
import { CmsRepositoryModule } from './repositories/cms.repository.module';
import { Cms, CmsDocument } from './schemas/cms.schema';

describe('CmsController (e2e)', () => {
    let app: INestApplication;
    let authService: AuthService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let userModel: Model<User>;
    let roleModel: Model<Role>;
    let cmsModel: Model<Cms>;

    let createAdmin: HydratedDocument<User>;
    let createRoleAdmin: RoleDocument;
    let accessToken: string;
    let cmsId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RootMongooseTestModule(),
                JwtModule.registerAsync({
                    useFactory: (configService: ConfigService) => ({
                        privateKey: configService.getOrThrow('JWT_SECRET'),
                        signOptions: {
                            expiresIn: configService.getOrThrow('JWT_ACCESS_EXPIRES_IN')
                        }
                    }),
                    inject: [ConfigService]
                }),
                ConfigModule.forRoot({
                    envFilePath: `.env.${process.env.NODE_ENV}`,
                    isGlobal: true,
                }),
                ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
                AuthModule,
                CmsModule,
                CmsRepositoryModule,
                UserRepositoryModule,
                RefreshTokenModule,
                RoleRepositoryModule,
                UserDeviceRepositoryModule,
                HelpersModule
            ],
            providers: [
                ConfigService
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        authService = moduleFixture.get(AuthService);
        configService = moduleFixture.get(ConfigService);
        jwtService = moduleFixture.get(JwtService);
        userModel = app.get(getModelToken(User.name));
        roleModel = app.get(getModelToken(Role.name));
        cmsModel = app.get(getModelToken(Cms.name));

        // Insert test role
        createRoleAdmin = await roleModel.create({ role: 'admin', roleDisplayName: 'Admin', roleGroup: 'backend' });
        // Insert test user
        createAdmin = await userModel.create({
            email: 'test.admin@yopmail.com',
            password: 'admin123@',
            fullName: 'Test Admin',
            userName: 'test_admin',
            role: createRoleAdmin?._id,
        });

        // Login to get access token
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: createAdmin.email, password: 'admin123@' });
        accessToken = loginResponse.body.data.accessToken;

        let cms = await cmsModel.create({ title: 'Test CMS', content: 'Test Content' })
        await cmsModel.create({ title: 'Test CMS 2', content: 'Test Content' })
        cmsId = cms._id.toJSON();
    });

    afterAll(async () => {
        await CloseInMongodConnection();
        await app.close();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('/getall (POST)', function () {
        it('Get all CMS entries', () => {
            return request(app.getHttpServer())
                .post('/admin/cms/getall')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ page: 1, limit: 10 })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('CMS data fetched successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });
    });

    describe('/:id (GET)', function () {
        it('Get a CMS entry by ID', () => {
            return request(app.getHttpServer())
                .get(`/admin/cms/${cmsId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('CMS retrieved successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to get a non-existing CMS entry', () => {
            return request(app.getHttpServer())
                .get(`/admin/cms/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('CMS not found!');
                });
        });
    });

    describe('/:id (PATCH)', function () {
        it('Update a CMS entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/cms/${cmsId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: 'Updated CMS', content: 'Updated Content' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('CMS updated successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update a duplicate title entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/cms/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: 'Test CMS 2', content: 'Non-existing Content' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('CMS title already exists');
                });
        });
    });

    describe('/status-change/:id (PATCH)', function () {
        it('Update CMS status', () => {
            return request(app.getHttpServer())
                .patch(`/admin/cms/status-change/${cmsId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'Active' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Status updated successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update status of a non-existing CMS entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/cms/status-change/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'Active' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Something went wrong!');
                });
        });
    });
});