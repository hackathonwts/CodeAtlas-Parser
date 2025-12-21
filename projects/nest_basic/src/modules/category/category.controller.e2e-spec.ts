// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CloseInMongodConnection, RootMongooseTestModule } from '@common/unit-test-config/mongoose-test-module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HydratedDocument, Model, Types } from 'mongoose';
import { UserRepositoryModule } from '@modules/users/repositories/user-repository.module';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { User } from '@modules/users/schemas/user.schema';
import { Role, RoleDocument } from '@modules/role/schemas/role.schema';
import { ThrottlerModule } from '@nestjs/throttler';
import { RefreshTokenModule } from '@modules/refresh-token/refresh-token.module';
import { RoleRepositoryModule } from '@modules/role/repositories/role.repository.module';
import { UserDeviceRepositoryModule } from '@modules/user-devices/repository/user-device-repository.module';
import { HelpersModule } from '@helpers/helpers.module';
import { AuthService } from '@auth/auth.service';
import { AuthModule } from '@auth/auth.module';
import { CategoryModule } from './category.module';
import { CategoryRepositoryModule } from './repositories/category.repository.module';

describe('CategoryController (e2e)', () => {
    let app: INestApplication;
    let authService: AuthService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let userModel: Model<User>;
    let roleModel: Model<Role>;

    let createAdmin: HydratedDocument<User>;
    let createRoleAdmin: RoleDocument;
    let accessToken: string;

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
                CategoryModule,
                CategoryRepositoryModule,
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
    });

    afterAll(async () => {
        await CloseInMongodConnection();
        await app.close();
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('/getall (POST)', function () {
        it('Get all categories', () => {
            return request(app.getHttpServer())
                .post('/admin/category/getall')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ page: 1, limit: 10 })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Category fetched successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });
    });

    describe('/ (POST)', function () {
        it('Create a new category', () => {
            return request(app.getHttpServer())
                .post('/admin/category')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'New Category', description: 'Category Description' })
                .expect(201)
                .expect((res) => {
                    expect(res.body.message).toBe('Data saved successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to create a category with existing name', () => {
            return request(app.getHttpServer())
                .post('/admin/category')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'New Category', description: 'Category Description' })
                .expect(409)
                .expect((res) => {
                    expect(res.body.message).toBe('Category already exists!');
                });
        });
    });

    describe('/:id (GET)', function () {
        let categoryId: string;

        beforeAll(async () => {
            const categoryResponse = await request(app.getHttpServer())
                .post('/admin/category')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Another Category', description: 'Another Description' });
            categoryId = categoryResponse.body.data._id;
        });

        it('Get a category by ID', () => {
            return request(app.getHttpServer())
                .get(`/admin/category/${categoryId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Category retrieved successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to get a non-existing category', () => {
            return request(app.getHttpServer())
                .get(`/admin/category/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Category not found!');
                });
        });
    });

    describe('/:id (PATCH)', function () {
        let categoryId: string;

        beforeAll(async () => {
            const categoryResponse = await request(app.getHttpServer())
                .post('/admin/category')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Update Category', description: 'Update Description' });
            categoryId = categoryResponse.body.data._id;
        });

        it('Update a category', () => {
            return request(app.getHttpServer())
                .patch(`/admin/category/${categoryId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Updated Category', description: 'Updated Description' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Category updated successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update a non-existing category', () => {
            return request(app.getHttpServer())
                .patch(`/admin/category/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Non-existing Category', description: 'Non-existing Description' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Category not found.');
                });
        });
    });

    describe('/:id (DELETE)', function () {
        let categoryId: string;

        beforeAll(async () => {
            const categoryResponse = await request(app.getHttpServer())
                .post('/admin/category')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Delete Category', description: 'Delete Description' });
            categoryId = categoryResponse.body.data._id;
        });

        it('Delete a category', () => {
            return request(app.getHttpServer())
                .delete(`/admin/category/${categoryId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Category deleted successfully.');
                });
        });

        it('Fail to delete a non-existing category', () => {
            return request(app.getHttpServer())
                .delete(`/admin/category/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Something went wrong!');
                });
        });
    });

    describe('/status-change/:id (PATCH)', function () {
        let categoryId: string;

        beforeAll(async () => {
            const categoryResponse = await request(app.getHttpServer())
                .post('/admin/category')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Status Category', description: 'Status Description' });
            categoryId = categoryResponse.body.data._id;
        });

        it('Update category status', () => {
            return request(app.getHttpServer())
                .patch(`/admin/category/status-change/${categoryId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'Active' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('Status updated successfully.');
                    expect(res.body.data).toBeDefined();
                });
        });

        it('Fail to update status of a non-existing category', () => {
            return request(app.getHttpServer())
                .patch(`/admin/category/status-change/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'Active' })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe('Something went wrong!');
                });
        });
    });
});