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
import { FaqModule } from './faq.module';
import { FaqRepositoryModule } from './repositories/faq.repository.module';
import { Faq } from './schemas/faq.schema';

describe('FaqController (e2e)', () => {
    let app: INestApplication;
    let authService: AuthService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let userModel: Model<User>;
    let roleModel: Model<Role>;
    let faqModel: Model<Faq>;

    let createAdmin: HydratedDocument<User>;
    let createRoleAdmin: RoleDocument;
    let accessToken: string;
    let faqId: string;

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
                FaqModule,
                FaqRepositoryModule,
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
        faqModel = app.get(getModelToken(Faq.name));

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

        let faq = await faqModel.create({ question: 'Test FAQ', answer: 'Test Answer' });
        await faqModel.create({ question: 'Test FAQ 2', answer: 'Test Answer 2' });
        faqId = faq._id.toJSON();
    });

    afterAll(async () => {
        await CloseInMongodConnection();
        await app.close();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('/getall (POST)', function () {
        it('Get all FAQ entries', () => {
            return request(app.getHttpServer())
                .post('/admin/faq/getall')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ page: 1, limit: 10 })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ data fetched successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });
    });

    describe('/:id (GET)', function () {
        it('Get a FAQ entry by ID', () => {
            return request(app.getHttpServer())
                .get(`/admin/faq/${faqId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ retrieved successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to get a non-existing FAQ entry', () => {
            return request(app.getHttpServer())
                .get(`/admin/faq/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ not found!');
                });
        });
    });

    describe('/ (POST)', function () {
        it('Add a FAQ entry', () => {
            return request(app.getHttpServer())
                .post(`/admin/faq`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ question: 'New FAQ', answer: 'New Answer' })
                .expect(201)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ saved successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update a duplicate question entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/faq/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ question: 'Test FAQ 2', answer: 'Non-existing Answer' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ question already exists!');
                });
        });
    });
    
    describe('/:id (PATCH)', function () {
        it('Update a FAQ entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/faq/${faqId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ question: 'Updated FAQ', answer: 'Updated Answer' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ updated successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update a duplicate question entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/faq/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ question: 'Test FAQ 2', answer: 'Non-existing Answer' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ question already exists!');
                });
        });
    });

    describe('/status-change/:id (PATCH)', function () {
        it('Update FAQ status', () => {
            return request(app.getHttpServer())
                .patch(`/admin/faq/status-change/${faqId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'Active' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ Status updated successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update status of a non-existing FAQ entry', () => {
            return request(app.getHttpServer())
                .patch(`/admin/faq/status-change/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'Active' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Something went wrong!');
                });
        });
    });

    describe('/:id (DELETE)', function () {
        it('Delete a FAQ entry', () => {
            return request(app.getHttpServer())
                .delete(`/admin/faq/${faqId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('FAQ deleted successfully.');
                });
        });

        it('Fail to delete a non-existing FAQ entry', () => {
            return request(app.getHttpServer())
                .delete(`/admin/faq/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Something went wrong!');
                });
        });
    });
});