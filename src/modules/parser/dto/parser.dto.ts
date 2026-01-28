export class CreateParserDto {
    readonly _id: string;
    readonly name: string;
    readonly description: string;
    readonly gitUrl: string;
    readonly username: string;
    readonly password: string;
    readonly projectName: string;
    readonly branch?: string;
}
