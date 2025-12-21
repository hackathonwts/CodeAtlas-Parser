import { StatusEnum } from "@common/enum/status.enum"
import { ApiProperty } from "@nestjs/swagger"
import { Transform, TransformFnParams } from "class-transformer"
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { Types } from "mongoose"

export class UserSignupDTO {
    @ApiProperty({ description: 'Full name of user', required: true })
    @IsString({ message: 'Value must be a string' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Full name is required!' })
    fullName: string

    @ApiProperty({ description: 'Email address', required: true })
    @IsString({ message: 'Value must be a string' })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsNotEmpty({ message: 'Email address is required!' })
    @IsEmail({}, { message: 'Please enter a valid email!' })
    email: string

    @ApiProperty({ description: 'Password', required: true })
    @IsString({ message: 'Value must be a string' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Password is required!' })
    password: string

    @ApiProperty({ description: 'Device Token', required: false })
    @IsOptional()
    deviceToken: string

    
    @ApiProperty({
        description: 'Profile image (jpg, png, jpeg)',
        type: 'string',
        format: 'binary',
        required: false
    })
    @IsOptional()
    profileImage: string
}

export class UserSignInDTO {
    @ApiProperty({ description: 'Email address', required: true })
    @IsString({ message: 'Value must be a string' })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsNotEmpty({ message: 'Email address is required!' })
    @IsEmail({}, { message: 'Please enter a valid email!' })
    email: string

    @ApiProperty({ description: 'Password', required: true })
    @IsString({ message: 'Value must be a string' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Password is required!' })
    password: string

    @ApiProperty({ description: 'Device Token', required: false })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsOptional()
    deviceToken: string
}

export class EmailVerificationDTO {
    @ApiProperty({ description: 'Email address', required: false })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string

    @ApiProperty({ description: 'OTP', required: true })
    @IsString({ message: 'OTP must be a string value!' })
    @IsNotEmpty({ message: 'OTP is required!' })
    otp: string
}

export class UserProfileUpdateDTO {
    @ApiProperty({ description: 'Full name of user', required: false })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Full name is required' })
    fullName: string

    @ApiProperty({ description: 'Email address', required: false })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string

    @ApiProperty({ description: 'Phone number', required: false })
    @IsOptional()
    phone: string

    @ApiProperty({ description: 'Country code for phone number', required: false })
    @IsOptional()
    countryCode: string

    @ApiProperty({
        description: 'Profile image (jpg, png, jpeg)',
        type: 'string',
        format: 'binary',
        required: false
    })
    profileImage: string
}

export class ForgotPasswordDTO {
    @ApiProperty({ description: 'Email address', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string


    @ApiProperty({ description: 'Base URL', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsNotEmpty({ message: 'Base URL is required!' })
    baseUrl: string
}


export class ResetPasswordDTO {
    @ApiProperty({ description: 'New password', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'New password is required!' })
    newPassword: string

    @ApiProperty({ description: 'Authorization token', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Authorization token is required!' })
    authToken: string
}


export class SaveUserDTO {
    @ApiProperty({ description: 'Email address', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string

    @ApiProperty({ description: 'Password', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Password is required!' })
    password: string

    @ApiProperty({ description: 'Full Name', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Full Name is required!' })
    fullName: string

    @ApiProperty({ description: 'User Name', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Name is required!' })
    userName: string

    @ApiProperty({ description: 'User Role', required: true, type: 'string' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Role is required!' })
    role: Types.ObjectId | string;

    @ApiProperty({
        description: 'Profile image (jpg, png, jpeg)',
        type: 'string',
        required: false,
        format: 'binary',
    })
    @IsNotEmpty()
    @IsOptional()
    profileImage?: string;
}

export class SaveFrontendUserDTO {
    @ApiProperty({ description: 'Email address', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string

    @ApiProperty({ description: 'Password', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Password is required!' })
    password: string

    @ApiProperty({ description: 'Full Name', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Full Name is required!' })
    fullName: string

    @ApiProperty({ description: 'User Name', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Name is required!' })
    userName: string

    @ApiProperty({ description: 'User Role', required: true, type: 'string' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Role is required!' })
    role: Types.ObjectId;

    @ApiProperty({
        description: 'Profile image (jpg, png, jpeg)',
        type: 'string',
        format: 'binary',
        required: false
    })
    @IsNotEmpty()
    @IsOptional()
    profileImage: string; // File to be uploaded via form-data

}

export class ListingUserDto {
    @ApiProperty({ default: 1 })
    @IsNumber()
    page?: number;

    @ApiProperty({ default: 10 })
    @IsNumber()
    limit?: number;

    @ApiProperty({ description: 'Search...', required: false })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ description: 'Status Filter', required: false })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiProperty({ description: 'Sort Field', required: false })
    @IsString()
    @IsOptional()
    sortField?: string;


    @ApiProperty({ description: 'Sort Order', required: false, enum: ['asc', 'desc'] })
    @IsString()
    @IsOptional()
    sortOrder?: string;


    @IsOptional()
    role?: Types.ObjectId;
}



export class StatusUserDto {
    @ApiProperty({ description: 'Status', required: true, enum: ["Active", "Inactive"] })
    @IsEnum(StatusEnum, { message: 'Status must be either "Active" or "Inactive"' })
    @IsNotEmpty({ message: 'Status is required' })
    status: string;
}



export class UpdateUserDto {
    @ApiProperty({ description: 'Email address', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string

    @ApiProperty({ description: 'Full Name', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Full Name is required!' })
    fullName: string

    @ApiProperty({ description: 'User Name', required: true })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Name is required!' })
    userName: string

    @ApiProperty({ description: 'User Role', required: true, type: 'string' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Role is required!' })
    role: Types.ObjectId;

    @ApiProperty({
        description: 'Profile image (jpg, png, jpeg)',
        type: 'string',
        format: 'binary',
        required: false
    })
    @IsOptional()
    profileImage: string;
}


export class ChangePasswordDto {
    @ApiProperty({ description: 'Current password', required: true })
    @IsString()
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword: string;

    @ApiProperty({ description: 'New password', required: true })
    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    password: string;
}


export class UpdateFrontendUserDto {
    @ApiProperty({ description: 'Email address', required: false })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase())
    @IsEmail({}, { message: 'Please enter a valid email!' })
    @IsNotEmpty({ message: 'Email address is required!' })
    email: string

    @ApiProperty({ description: 'Full Name', required: false })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'Full Name is required!' })
    fullName: string

    @ApiProperty({ description: 'User Name', required: false })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: 'User Name is required!' })
    userName: string

    @ApiProperty({
        description: 'Profile image (jpg, png, jpeg)',
        type: 'string',
        format: 'binary',
        required: false
    })
    @IsOptional()
    profileImage: string;
}