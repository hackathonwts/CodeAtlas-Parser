import { IsNotEmpty, IsString, IsNumber, IsOptional, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger"
import { Transform, TransformFnParams } from "class-transformer"

export class UpdateCmsDto {
    @ApiProperty({ description: 'Title', required: true })
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    title: string;

    @ApiProperty({ description: 'Content', required: true })
    @IsString()
    @IsNotEmpty({ message: 'Content is required' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    content: string;
}


export class CmsListingDto {
    @ApiProperty({ default: 1 })
    @IsNumber()
    page?: number;

    @ApiProperty({ default: 10 })
    @IsNumber()
    limit?: number;

    @ApiProperty({ description: 'Search...', required: false })
    @IsString()
    @IsOptional()
    search: string;

    @ApiProperty({ description: 'Status Filter', required: false })
    @IsString()
    @IsOptional()
    status: string;

    @ApiProperty({ description: 'Sort Field', required: false })
    @IsString()
    @IsOptional()
    sortField: string;

    @ApiProperty({ description: 'Sort Order', required: false, enum: ['asc', 'desc'] })
    @IsString()
    @IsOptional()
    sortOrder: string;
}


export class StatusCmsDto {
    @ApiProperty({ description: 'Status', required: true, enum: ["Active", "Inactive"] })
    @IsString()
    @IsNotEmpty({ message: 'Status is required' })
    @Matches(/^(Active|Inactive)$/, { message: 'Status must be either "Active" or "Inactive"' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    status: string;
}