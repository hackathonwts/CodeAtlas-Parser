export class CreateParserDto {
    readonly _id: string;
    readonly name: string;
    readonly description: string;
    readonly gitUrl: string;
    readonly gitUsername: string;
    readonly gitPassword: string;
    readonly branch?: string;
}
