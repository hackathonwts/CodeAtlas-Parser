import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty,  IsString } from "class-validator";

export class RefreshJwtDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ description: 'Refresh token to get new access token' })
    refreshToken: string;
}

export class LogoutDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ description: 'Refresh token to revoke' })
    refreshToken: string;
}

 
