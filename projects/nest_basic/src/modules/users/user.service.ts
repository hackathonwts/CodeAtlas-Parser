import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { RoleRepository } from '@modules/role/repositories/role.repository';
import { ChangePasswordDto, ListingUserDto, SaveUserDTO, StatusUserDto, UpdateFrontendUserDto, UpdateUserDto } from './dto/user.dto';
import type { ApiResponse } from '@common/types/api-response.type';
import { UserRepository } from './repositories/user.repository';
import { UserDocument } from './schemas/user.schema';
import { Messages } from '@common/constants/messages';


@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleRepository: RoleRepository,
    ) { }


    async getAllUsers(body: ListingUserDto): Promise<ApiResponse> {
        const superAdminDetails = await this.roleRepository.getByField({ 'role': 'admin', isDeleted: false });
        body['role'] = superAdminDetails._id;

        const getAllUsers = await this.userRepository.getAllPaginateAdmin(body);
        return { message: 'User data fetched successfully.', data: getAllUsers };
    }


    async profileDetails(user: Partial<UserDocument>): Promise<ApiResponse> {
        const userDetails = await this.userRepository.getUserDetails({ _id: new Types.ObjectId(user._id), isDeleted: false });

        return { message: 'Profile details retrieved successfully.', data: userDetails };
    }

    async saveUser(body: SaveUserDTO, files: Express.Multer.File[]): Promise<ApiResponse> {
        const userRole = await this.roleRepository.getByField({ _id: new Types.ObjectId(body.role), isDeleted: false });
        if (!userRole?._id) throw new BadRequestException('User role not found!');

        const isEmailExists = await this.userRepository.getByField({ email: { $regex: '^' + body.email + '$', $options: 'i' }, isDeleted: false });
        if (isEmailExists?._id) throw new BadRequestException('User with this email already exists!');

        const isUserNameExists = await this.userRepository.getByField({ userName: body.userName, isDeleted: false });
        if (isUserNameExists?._id) throw new BadRequestException('User with this user name already exists!');

        if (files?.length) {
            body.profileImage = files[0].filename;
        }

        // Save new User if the question doesn't exist
        const saveUser = await this.userRepository.save(body);
        if (!saveUser) {
            throw new BadRequestException(saveUser);
        }

        return { message: 'User added successfully.', data: saveUser };
    }


    async getUser(id: string): Promise<ApiResponse> {
        const user = await this.userRepository.getByFieldWithProjection({ _id: new Types.ObjectId(id), isDeleted: false }, {
            userName: 1,
            fullName: 1,
            email: 1,
            profileImage: 1,
            role: 1
        });

        if (!user) throw new NotFoundException('User not found!');
        return { message: 'User retrieved successfully.', data: user };
    }


    async updateUser(id: string, body: UpdateUserDto, files: Express.Multer.File[]): Promise<ApiResponse> {
        const isEmailExists = await this.userRepository.getByField({ email: body.email, isDeleted: false, _id: { $ne: new Types.ObjectId(id) } });
        if (isEmailExists?._id) throw new BadRequestException('User with this email already exists!');

        const isUserNameExists = await this.userRepository.getByField({ userName: body.userName, isDeleted: false, _id: { $ne: new Types.ObjectId(id) } });
        if (isUserNameExists?._id) throw new BadRequestException('User with this user name already exists!');

        const updatedValue = {
            fullName: body.fullName,
            email: body.email,
            userName: body.userName
        };

        if (files?.length) {
            updatedValue['profileImage'] = files[0].filename;
        }

        // Save new User if the question doesn't exist
        const updateUser = await this.userRepository.updateById(updatedValue, new Types.ObjectId(id));
        if (!updateUser) {
            throw new BadRequestException(updateUser);
        }

        return { message: 'User updated successfully.', data: updateUser };
    }


    async changePassword(id: string, body: ChangePasswordDto): Promise<ApiResponse> {
        const user = await this.userRepository.getByFieldWithProjection({ _id: new Types.ObjectId(id), isDeleted: false }, { password: 1 });
        if (!user) throw new NotFoundException('User not found!');

        const oldPasswordMatch = user.validPassword(body.currentPassword);
        if (!oldPasswordMatch) throw new BadRequestException('Old credential mis-matched!');

        const newPassVsOldPass = user.validPassword(body.password);
        if (newPassVsOldPass) throw new BadRequestException('New password cannot be same as your old password!');

        body.password = user.generateHash(body.password);
        const userUpdate = await this.userRepository.updateById(body, new Types.ObjectId(id));
        if (!userUpdate) {
            throw new BadRequestException(userUpdate);
        }

        return { message: 'User password updated successfully.', data: userUpdate };
    }


    async deleteUser(id: string): Promise<ApiResponse> {
        const deleteData = await this.userRepository.updateById({ isDeleted: true }, id);
        if (!deleteData) {
            throw new BadRequestException(deleteData);
        }

        return { message: 'User deleted successfully.' };
    }

    async updateUserStatus(id: string, body: StatusUserDto): Promise<ApiResponse> {
        const updateStatus = await this.userRepository.updateById({ status: body.status }, new Types.ObjectId(id));
        if (!updateStatus) {
            throw new BadRequestException(updateStatus);
        }

        return { message: 'Status updated successfully.', data: updateStatus };
    }


    async updateFrontendUser(id: string, body: UpdateFrontendUserDto, files: Express.Multer.File[]): Promise<ApiResponse> {
        const isEmailExists = await this.userRepository.getByField({ email: { $regex: '^' + body.email + '$', $options: 'i' }, isDeleted: false, _id: { $ne: new Types.ObjectId(id) } });
        if (isEmailExists?._id) throw new BadRequestException(Messages.USER_EXIST_ERROR);

        const isUserNameExists = await this.userRepository.getByField({ userName: body.userName, isDeleted: false, _id: { $ne: new Types.ObjectId(id) } });
        if (isUserNameExists?._id) throw new BadRequestException(Messages.USERNAME_EXIST_ERROR);

        if (files?.length) {
            for (const file of files) {
                body[file.fieldname] = file.filename;
            }
        }

        const updateUser = await this.userRepository.updateById(body, new Types.ObjectId(id));
        if (!updateUser) throw new BadRequestException(updateUser instanceof Error ? updateUser.message : Messages.SOMETHING_WENT_WRONG);
        return { message: Messages.PROFILE_UPDATE_SUCCESS, data: updateUser };
    }
}
