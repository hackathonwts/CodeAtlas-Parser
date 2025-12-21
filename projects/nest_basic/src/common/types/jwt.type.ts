export type JwtPayloadType = {
    id: string;
    tokenId?: string; // MongoDB _id of the refresh token record
    iat?: string;
}